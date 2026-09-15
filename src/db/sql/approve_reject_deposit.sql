-- Approves a pending-deposit reservation, promoting it to 'confirmed'.
-- Capacity is re-checked HERE (not at booking time) since a pending
-- reservation never held its slot — someone else may have booked it in
-- the meantime. If it no longer fits, the reservation is left pending
-- (status returned as 'full') so staff can decide manually rather than
-- silently cancelling it.
create or replace function approve_deposit(
  p_code text
) returns table (status text) as $$
declare
  v_row reservations%rowtype;
  v_capacity int;
  v_booked int;
begin
  select * into v_row from reservations where confirmation_code = p_code for update;

  if not found then
    return query select 'not_found'::text;
    return;
  end if;

  if v_row.status <> 'pending_deposit' then
    return query select 'not_pending'::text;
    return;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_row.reservation_date::text || v_row.reservation_time::text, 0)
  );

  select capacity into v_capacity
  from slot_capacity
  where slot_time = v_row.reservation_time;

  select coalesce(sum(party_size), 0) into v_booked
  from reservations
  where reservation_date = v_row.reservation_date
    and reservation_time = v_row.reservation_time
    and reservations.status = 'confirmed';

  if v_booked + v_row.party_size > coalesce(v_capacity, 0) then
    return query select 'full'::text;
    return;
  end if;

  update reservations
  set status = 'confirmed', deposit_verified = true, confirmed_at = now(), updated_at = now()
  where id = v_row.id;

  return query select 'confirmed'::text;
end;
$$ language plpgsql;

--> statement-breakpoint

-- Rejects a pending-deposit reservation, cancelling it. Nothing to free
-- up capacity-wise since pending reservations never counted against it.
create or replace function reject_deposit(
  p_code text
) returns table (status text) as $$
declare
  v_row reservations%rowtype;
begin
  select * into v_row from reservations where confirmation_code = p_code for update;

  if not found then
    return query select 'not_found'::text;
    return;
  end if;

  if v_row.status <> 'pending_deposit' then
    return query select 'not_pending'::text;
    return;
  end if;

  update reservations
  set status = 'cancelled', cancellation_reason = 'deposit_rejected', cancelled_at = now(),
      updated_at = now()
  where id = v_row.id;

  return query select 'rejected'::text;
end;
$$ language plpgsql;
