export interface MenuItem {
  // Set once the item comes from the editable menu store (see
  // src/db/menuStore.ts); absent in the hand-written seed data below.
  id?: string;
  name_es: string;
  name_en: string;
  desc_es: string;
  desc_en: string;
  // Optional: absent while a price is still pending confirmation with the
  // owner — MenuAccordion simply omits the price badge until it's set.
  price?: number;
  // Optional: path under /public once a real photo exists for this item
  // (e.g. "/carta/dama-de-pon.jpg"). Until then, MenuAccordion/MenuTeaser
  // render a branded placeholder in its place — set this and the photo
  // takes over automatically, no other code changes needed.
  image?: string;
  // Optional: groups items under a sub-heading within a category (e.g.
  // "Platos" separated into Entradas/Para Compartir/Fuertes) without
  // splitting it into its own accordion category.
  subcategory_es?: string;
  subcategory_en?: string;
}

export interface MenuCategory {
  id: string;
  es: string;
  en: string;
  items: MenuItem[];
}

// NOTE: this file is only the *initial* menu. `npm run db:seed` copies it
// into the database once, and from then on the owners edit the menu from
// /admin/carta — changes made here afterwards won't show up on the site.
//
// PON Lounge's real cocktail list (from the house recipe book), ordered by
// priority: house creations first, then the most exclusive spirit-forward
// categories, down to non-alcoholic. Food/dessert/wine categories below are
// still sample content pending the client's real menu.
export const cocktailMenu: MenuCategory[] = [
  {
    id: "casa",
    es: "Cócteles de la Casa P.O.N",
    en: "P.O.N House Cocktails",
    items: [
      {
        name_es: "Dama de P.O.N",
        name_en: "Dama de P.O.N",
        desc_es:
          "Licor de almendras con una suavidad aromática y una elegancia que se queda. Un cierre especiado que invita a quedarse una copa más.",
        desc_en:
          "Almond liqueur with an aromatic softness and a lingering elegance. A spiced finish that invites one more glass.",
        price: 52000,
        image: "/carta/dama-de-pon.jpg",
      },
      {
        name_es: "Pacífico Sour",
        name_en: "Pacífico Sour",
        desc_es:
          "Viche del Pacífico colombiano convertido en un homenaje líquido: carácter, historia y espuma sedosa en cada sorbo.",
        desc_en:
          "Viche from Colombia's Pacific coast turned into a liquid tribute: character, history, and silky foam in every sip.",
        price: 42000,
      },
      {
        name_es: "Viche Tónic",
        name_en: "Viche Tónic",
        desc_es:
          "Viche herbal y fresco, con alma ancestral — el Pacífico colombiano sentido en una copa.",
        desc_en:
          "Herbal, fresh viche with an ancestral soul — Colombia's Pacific coast, felt in a glass.",
        price: 42000,
      },
      {
        name_es: "Viche Colada",
        name_en: "Viche Colada",
        desc_es:
          "Viche envuelto en dulzura tropical. Como una tarde de playa condensada en un solo trago.",
        desc_en:
          "Viche wrapped in tropical sweetness. Like a beach afternoon condensed into one drink.",
        price: 46000,
        image: "/carta/viche-colada.jpg",
      },
      {
        name_es: "Black Lounge",
        name_en: "Black Lounge",
        desc_es:
          "El trago insignia de la casa en su versión más oscura y envolvente — carácter puro de PON Lounge.",
        desc_en:
          "The house's signature drink in its darkest, most immersive form — pure PON Lounge character.",
        price: 45000,
      },
    ],
  },
  {
    id: "caracter",
    es: "Cócteles de Carácter",
    en: "Character Cocktails",
    items: [
      {
        name_es: "Negroni",
        name_en: "Negroni",
        desc_es:
          "Gin amargo, intenso y sin concesiones. Para quienes ya saben exactamente lo que quieren.",
        desc_en:
          "Bitter, intense gin with no compromises. For those who already know exactly what they want.",
        price: 49000,
        image: "/carta/negroni.jpg",
      },
      {
        name_es: "Old Fashioned",
        name_en: "Old Fashioned",
        desc_es:
          "Bourbon, tiempo y un toque de humo. El clásico que nunca pasa de moda.",
        desc_en:
          "Bourbon, time, and a touch of smoke. The classic that never goes out of style.",
        price: 49000,
        image: "/carta/old-fashioned.jpg",
      },
      {
        name_es: "Mezcalita",
        name_en: "Mezcalita",
        desc_es:
          "Mezcal ahumado y con carácter — para quienes buscan algo con más profundidad.",
        desc_en:
          "Smoky mezcal with character — for those looking for something with more depth.",
        price: 52000,
      },
      {
        name_es: "Dry Martini",
        name_en: "Dry Martini",
        desc_es:
          "Gin frío, directo y elegante. Sofisticación en su forma más pura.",
        desc_en:
          "Cold, direct, elegant gin. Sophistication in its purest form.",
        price: 49000,
        image: "/carta/dry-martini.jpg",
      },
      {
        name_es: "Manhattan",
        name_en: "Manhattan",
        desc_es:
          "Whisky aterciopelado y con carácter, para las noches que se disfrutan despacio.",
        desc_en:
          "Velvety whiskey with character, for nights meant to be savored slowly.",
        price: 49000,
        image: "/carta/manhattan.jpg",
      },
      {
        name_es: "Espresso Martini",
        name_en: "Espresso Martini",
        desc_es:
          "Vodka con energía y elegancia en una sola copa — el impulso perfecto para que la noche siga.",
        desc_en:
          "Vodka with energy and elegance in one glass — the perfect lift to keep the night going.",
        price: 42000,
        image: "/carta/espresso-martini.jpg",
      },
    ],
  },
  {
    id: "gintonics",
    es: "Gin Tonics",
    en: "Gin & Tonics",
    items: [
      {
        name_es: "Tanqueray London Dry",
        name_en: "Tanqueray London Dry",
        desc_es:
          "Gin botánico, seco y directo — el gin tonic clásico en su máxima expresión.",
        desc_en:
          "Botanical, dry gin, straight to the point — the classic gin & tonic at its best.",
        price: 60000,
      },
      {
        name_es: "Tanqueray No. Ten",
        name_en: "Tanqueray No. Ten",
        desc_es:
          "Gin floral y suave, con un guiño cítrico que lo hace inconfundible.",
        desc_en:
          "Floral, smooth gin with a citrus wink that makes it unmistakable.",
        price: 65000,
        image: "/carta/tanqueray-no-ten.jpg",
      },
      {
        name_es: "Bombay Sapphire",
        name_en: "Bombay Sapphire",
        desc_es:
          "Gin aromático y equilibrado, para quienes disfrutan los detalles.",
        desc_en: "Aromatic, balanced gin, for those who savor the details.",
        price: 58000,
      },
      {
        name_es: "Monkey 47",
        name_en: "Monkey 47",
        desc_es:
          "Gin intenso y especiado — carácter puro para los paladares más exigentes.",
        desc_en:
          "Intense, spiced gin — pure character for the most demanding palates.",
        price: 86000,
      },
      {
        name_es: "Hendrick's",
        name_en: "Hendrick's",
        desc_es:
          "Gin fresco y floral, una experiencia sensorial distinta a cualquier otra.",
        desc_en: "Fresh, floral gin — a sensory experience unlike any other.",
        price: 68000,
      },
    ],
  },
  {
    id: "citricos",
    es: "Cócteles Cítricos",
    en: "Citrus Cocktails",
    items: [
      {
        name_es: "Margarita",
        name_en: "Margarita",
        desc_es:
          "Tequila ácido, dulce y con un toque picante — el equilibrio perfecto en cada sorbo.",
        desc_en:
          "Sharp, sweet tequila with a hint of spice — perfect balance in every sip.",
        price: 46000,
        image: "/carta/margarita.jpg",
      },
      {
        name_es: "Paloma",
        name_en: "Paloma",
        desc_es:
          "Tequila cítrico, burbujeante y refrescante — ideal para una noche ligera.",
        desc_en:
          "Citrusy, bubbly tequila — refreshing and light, ideal for an easy night.",
        price: 46000,
      },
      {
        name_es: "Mojito",
        name_en: "Mojito",
        desc_es:
          "Ron blanco con toda la frescura cubana de siempre — hierbabuena, cítricos y mucha frescura.",
        desc_en:
          "White rum with all the classic Cuban freshness — mint, citrus, and plenty of freshness.",
        price: 46000,
      },
      {
        name_es: "Daiquiri",
        name_en: "Daiquiri",
        desc_es:
          "Ron simple, cítrico y perfectamente balanceado — un clásico que nunca decepciona.",
        desc_en:
          "Simple, citrusy, perfectly balanced rum — a classic that never disappoints.",
        price: 46000,
        image: "/carta/daiquiri.jpg",
      },
      {
        name_es: "Moscow Mule",
        name_en: "Moscow Mule",
        desc_es:
          "Vodka picante, cítrico y muy refrescante — servido en su icónico vaso de cobre.",
        desc_en:
          "Spicy, citrusy vodka, very refreshing — served in its iconic copper mug.",
        price: 46000,
        image: "/carta/moscow-mule.jpg",
      },
      {
        name_es: "Cuba Libre",
        name_en: "Cuba Libre",
        desc_es:
          "Ron y cola con un toque de limón — el clásico caribeño directo y sin complicaciones.",
        desc_en:
          "Rum and cola with a splash of lime — the straightforward Caribbean classic.",
        price: 46000,
      },
      {
        name_es: "Mezcal Mule",
        name_en: "Mezcal Mule",
        desc_es:
          "Mezcal picante, cítrico y muy refrescante — servido en su icónico vaso de cobre.",
        desc_en:
          "Spicy, citrusy mezcal, very refreshing — served in its iconic copper mug.",
        price: 54000,
        image: "/carta/mezcal-mule.jpg",
      },
      {
        name_es: "Caipirinha",
        name_en: "Caipirinha",
        desc_es: "Cachaza directa y rústica, tal como se disfruta en Brasil.",
        desc_en:
          "Straightforward, rustic cachaça, just as it's enjoyed in Brazil.",
        price: 46000,
        image: "/carta/caipirinha.jpg",
      },
      {
        name_es: "Caipiroska Fresa",
        name_en: "Strawberry Caipiroska",
        desc_es:
          "Vodka fresco y frutal con fresa — la versión suave de la caipirinha clásica.",
        desc_en:
          "Fresh, fruity vodka with strawberry — the smoother take on the classic caipirinha.",
        price: 46000,
        image: "/carta/caipiroska-fresa.jpg",
      },
      {
        name_es: "Caipiroska Limón",
        name_en: "Lime Caipiroska",
        desc_es:
          "Vodka fresco y cítrico con limón adicionado — la versión suave de la caipirinha clásica.",
        desc_en:
          "Fresh, citrusy vodka with added lime — the smoother take on the classic caipirinha.",
        price: 46000,
      },
      {
        name_es: "Tamarindo Splash",
        name_en: "Tamarindo Splash",
        desc_es:
          "Trago tropical de tamarindo con un splash refrescante — dulce, ácido y con carácter.",
        desc_en:
          "Tropical tamarind drink with a refreshing splash — sweet, tart, and full of character.",
        price: 42000,
        image: "/carta/tamarindo-splash.jpg",
      },
      {
        name_es: "Whisky Sour",
        name_en: "Whisky Sour",
        desc_es:
          "Whisky sedoso, cítrico y con carácter — el equilibrio entre lo dulce y lo fuerte.",
        desc_en:
          "Silky, citrusy whiskey with character — the balance between sweet and strong.",
        price: 49000,
      },
      {
        name_es: "New York Sour",
        name_en: "New York Sour",
        desc_es:
          "Whisky en su versión más elegante: la evolución del sour clásico con un toque final de vino tinto.",
        desc_en:
          "Whiskey in its most elegant form: the classic sour's evolution with a red wine float.",
        price: 49000,
      },
    ],
  },
  {
    id: "aperitivos",
    es: "Aperitivos",
    en: "Aperitifs",
    items: [
      {
        name_es: "Aperol Spritz",
        name_en: "Aperol Spritz",
        desc_es:
          "Aperol burbujeante con prosecco, ligero y color atardecer — el aperitivo italiano por excelencia.",
        desc_en:
          "Bubbly Aperol with prosecco, light and sunset-colored — the quintessential Italian aperitif.",
        price: 35000,
        image: "/carta/aperol-spritz.jpg",
      },
      {
        name_es: "Mimosa",
        name_en: "Mimosa",
        desc_es:
          "Prosecco simple, elegante y perfecto para brindar en cualquier momento.",
        desc_en: "Simple, elegant prosecco — perfect for a toast any time.",
        price: 35000,
      },
      {
        name_es: "Limoncello Spritz",
        name_en: "Limoncello Spritz",
        desc_es:
          "Limoncello italiano con burbujas y un toque cítrico intenso — fresco, dulce y con carácter mediterráneo.",
        desc_en:
          "Italian limoncello with bubbles and a bright citrus kick — fresh, sweet, and full of Mediterranean character.",
        price: 46000,
      },
      {
        name_es: "Copa de Sangría Tinto",
        name_en: "Red Sangria (Glass)",
        desc_es:
          "Vino tinto macerado con frutas — la copa clásica para compartir el momento.",
        desc_en:
          "Red wine steeped with fruit — the classic glass to share the moment.",
        price: 39000,
        subcategory_es: "Sangría",
        subcategory_en: "Sangria",
      },
      {
        name_es: "Copa de Sangría Rosé",
        name_en: "Rosé Sangria (Glass)",
        desc_es:
          "Vino rosé macerado con frutas — ligera, fresca y fácil de disfrutar.",
        desc_en:
          "Rosé wine steeped with fruit — light, fresh, and easy to enjoy.",
        price: 39000,
        subcategory_es: "Sangría",
        subcategory_en: "Sangria",
      },
      {
        name_es: "Jarra de Sangría Tinto",
        name_en: "Red Sangria (Pitcher)",
        desc_es:
          "La misma sangría tinto, en formato jarra para compartir en grupo.",
        desc_en: "The same red sangria, in a pitcher to share with the table.",
        price: 180000,
        subcategory_es: "Sangría",
        subcategory_en: "Sangria",
      },
      {
        name_es: "Jarra de Sangría Rosé",
        name_en: "Rosé Sangria (Pitcher)",
        desc_es:
          "La misma sangría rosé, en formato jarra para compartir en grupo.",
        desc_en: "The same rosé sangria, in a pitcher to share with the table.",
        price: 180000,
        subcategory_es: "Sangría",
        subcategory_en: "Sangria",
      },
    ],
  },
  {
    id: "sinlicor",
    es: "Cócteles Sin Licor",
    en: "Non-Alcoholic Cocktails",
    items: [
      {
        name_es: "Mojito sin Licor",
        name_en: "Mojito (Alcohol-Free)",
        desc_es:
          "Toda la frescura del mojito clásico, sin una gota de alcohol — hierbabuena, cítricos y mucha efervescencia.",
        desc_en:
          "All the freshness of the classic mojito, without a drop of alcohol — mint, citrus, and plenty of fizz.",
        price: 29000,
      },
      {
        name_es: "Piña Colada sin Licor",
        name_en: "Piña Colada (Alcohol-Free)",
        desc_es:
          "Dulce, tropical y cremosa — un viaje al Caribe en cada sorbo, sin alcohol.",
        desc_en:
          "Sweet, tropical, and creamy — a trip to the Caribbean in every sip, alcohol-free.",
        price: 38000,
      },
      {
        name_es: "Moscow Mule sin Licor",
        name_en: "Moscow Mule (Alcohol-Free)",
        desc_es:
          "Toda la chispa picante y cítrica del Moscow Mule clásico, sin una gota de alcohol — servido en su vaso de cobre.",
        desc_en:
          "All the spicy, citrusy kick of the classic Moscow Mule, without a drop of alcohol — served in its copper mug.",
        price: 33000,
      },
    ],
  },
  {
    id: "limonadas",
    es: "Limonadas",
    en: "Lemonades",
    items: [
      {
        name_es: "Natural",
        name_en: "Natural",
        desc_es:
          "Fresca, ácida y ligera — el respiro perfecto entre copa y copa.",
        desc_en:
          "Fresh, tart, and light — the perfect breather between drinks.",
        price: 18000,
      },
      {
        name_es: "Hierbabuena",
        name_en: "Mint",
        desc_es:
          "Refrescante y aromática, con un toque herbal que despierta los sentidos.",
        desc_en:
          "Refreshing and aromatic, with an herbal touch that wakes up the senses.",
        price: 23000,
      },
    ],
  },
];

// PON Lounge's real bottle/beer/soda catalog (from the Siigo Nube POS
// export). Organized by spirit type, each with Shots / Botellas / Media
// Botella subcategories where the venue actually sells that tier. A few
// items still have no `price`: they exist in the POS but the owner
// hasn't loaded a price for them yet (shown with no price badge until
// then). Food/brunch/desserts were removed — PON Lounge doesn't have a
// kitchen menu in the system, so there was no real data to reconcile
// against; re-add a category here if that changes.
export const menu: MenuCategory[] = [
  {
    id: "vinos",
    es: "Vinos y Champagne",
    en: "Wine & Champagne",
    items: [
      {
        name_es: "Copa de Vino Tinto Reserva",
        name_en: "Reserve Red Wine (Glass)",
        desc_es: "Selección de bodegas internacionales",
        desc_en: "Curated international selection",
        price: 38000,
      },
      {
        name_es: "Copa de Champagne",
        name_en: "Champagne Glass",
        desc_es: "Burbujas para celebrar cualquier ocasión",
        desc_en: "Bubbles to celebrate any occasion",
        price: 42000,
      },
    ],
  },
  {
    id: "whiskies",
    es: "Whiskies",
    en: "Whiskies",
    items: [
      {
        name_es: "J.W Red Label",
        name_en: "J.W Red Label",
        desc_es: "Blended escocés, servido solo, con hielo o en las rocas",
        desc_en: "Blended Scotch, served neat, on the rocks, or with a splash",
        price: 40000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "J.W Black Label",
        name_en: "J.W Black Label",
        desc_es: "Blended escocés, servido solo, con hielo o en las rocas",
        desc_en: "Blended Scotch, served neat, on the rocks, or with a splash",
        price: 40000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Jameson",
        name_en: "Jameson",
        desc_es:
          "Whisky irlandés suave y versátil — el clásico infalible, solo o en las rocas.",
        desc_en:
          "Smooth, versatile Irish whiskey — the reliable classic, neat or on the rocks.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "J.W Blue Label",
        name_en: "J.W Blue Label",
        desc_es:
          "La cumbre de Johnnie Walker: blend ultra premium, sedoso y complejo.",
        desc_en:
          "The pinnacle of Johnnie Walker: an ultra-premium blend, silky and complex.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "J.W 18 Años",
        name_en: "J.W 18 Years",
        desc_es:
          "Blend añejado 18 años, profundo y con un final largo y especiado.",
        desc_en: "18-year blend, deep and complex with a long, spiced finish.",
        price: 60000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Old Parr 18 Años",
        name_en: "Old Parr 18 Years",
        desc_es:
          "Blended escocés añejado, redondo y con notas amaderadas intensas.",
        desc_en: "Aged blended Scotch, round and rich with deep oak notes.",
        price: 48000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Old Parr 12 Años",
        name_en: "Old Parr 12 Years",
        desc_es: "Blended escocés clásico, suave y equilibrado.",
        desc_en: "Classic blended Scotch, smooth and well-balanced.",
        price: 39000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Monkey Shoulder",
        name_en: "Monkey Shoulder",
        desc_es:
          "Blend de malta triple, suave y versátil para tomar solo o en cóctel.",
        desc_en:
          "Triple malt blend, smooth and versatile — neat or in a cocktail.",
        price: 34000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Glenfiddich 18 Años",
        name_en: "Glenfiddich 18 Years",
        desc_es: "Single malt añejado, notas a fruta madura y roble español.",
        desc_en: "Aged single malt, notes of ripe fruit and Spanish oak.",
        price: 75000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Glenfiddich 15 Años",
        name_en: "Glenfiddich 15 Years",
        desc_es:
          "Single malt madurado en tres tipos de barrica, suave y especiado.",
        desc_en:
          "Single malt matured across three cask types, smooth and spiced.",
        price: 50000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Glenfiddich 12 Años",
        name_en: "Glenfiddich 12 Years",
        desc_es:
          "Single malt fresco y afrutado, el clásico de entrada de la casa.",
        desc_en: "Fresh, fruity single malt — the house's classic entry point.",
        price: 48000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "The Macallan 12 Años Double Cask",
        name_en: "The Macallan 12 Years Double Cask",
        desc_es:
          "Single malt madurado en doble barrica de jerez, notas a vainilla y especias dulces.",
        desc_en:
          "Single malt double-matured in sherry casks, notes of vanilla and sweet spice.",
        price: 58000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Buchanan's Máster",
        name_en: "Buchanan's Master",
        desc_es:
          "Blend escocés premium, suave y complejo, para paladares exigentes.",
        desc_en:
          "Premium Scotch blend, smooth and complex, for demanding palates.",
        price: 50000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Buchanan's 18 Años",
        name_en: "Buchanan's 18 Years",
        desc_es: "Blend escocés añejado, elegante y con un final largo.",
        desc_en: "Aged Scotch blend, elegant with a long finish.",
        price: 60000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Buchanan's 12 Años",
        name_en: "Buchanan's 12 Years",
        desc_es: "Blend escocés suave y accesible, ideal solo o en las rocas.",
        desc_en:
          "Smooth, approachable Scotch blend, great neat or on the rocks.",
        price: 39000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Bulleit Rye",
        name_en: "Bulleit Rye",
        desc_es:
          "Whiskey de centeno, especiado y con carácter — ideal en coctelería.",
        desc_en: "Rye whiskey, spiced and bold — great in cocktails.",
        price: 40000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Bulleit Bourbon",
        name_en: "Bulleit Bourbon",
        desc_es: "Bourbon con alto contenido de centeno, robusto y especiado.",
        desc_en: "High-rye bourbon, bold and spiced.",
        price: 39000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Chivas Regal 12 Años",
        name_en: "Chivas Regal 12 Years",
        desc_es: "Blended escocés clásico, suave, dulce y fácil de tomar.",
        desc_en: "Classic blended Scotch, smooth, sweet, and easy-drinking.",
        price: 28000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Jack Daniel's N°7",
        name_en: "Jack Daniel's N°7",
        desc_es:
          "Whiskey de Tennessee, filtrado en carbón — dulce y con carácter.",
        desc_en: "Tennessee whiskey, charcoal-mellowed — sweet with character.",
        price: 42000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Jack Daniel's Honey",
        name_en: "Jack Daniel's Honey",
        desc_es:
          "Whiskey de Tennessee con miel — dulce, suave y fácil de tomar.",
        desc_en:
          "Tennessee whiskey with honey — sweet, smooth, and easy-drinking.",
        price: 42000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Baileys Original",
        name_en: "Baileys Original",
        desc_es: "Crema de whiskey irlandés, dulce y aterciopelada.",
        desc_en: "Irish whiskey cream, sweet and velvety.",
        price: 17000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Buchanan's Pineapple",
        name_en: "Buchanan's Pineapple",
        desc_es:
          "Whisky escocés con infusión de piña — dulce, tropical y fácil de tomar.",
        desc_en:
          "Scotch whisky infused with pineapple — sweet, tropical, and easy-drinking.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Jameson",
        name_en: "Jameson",
        desc_es:
          "Whisky irlandés suave y versátil — el clásico infalible, solo o en las rocas.",
        desc_en:
          "Smooth, versatile Irish whiskey — the reliable classic, neat or on the rocks.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "J.W Blue Label",
        name_en: "J.W Blue Label",
        desc_es:
          "La cumbre de Johnnie Walker: blend ultra premium, sedoso y complejo.",
        desc_en:
          "The pinnacle of Johnnie Walker: an ultra-premium blend, silky and complex.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "J.W 18 Años",
        name_en: "J.W 18 Years",
        desc_es:
          "Blend añejado 18 años, profundo y con un final largo y especiado.",
        desc_en: "18-year blend, deep and complex with a long, spiced finish.",
        price: 930000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Old Parr 18 Años",
        name_en: "Old Parr 18 Years",
        desc_es:
          "Blended escocés añejado, redondo y con notas amaderadas intensas.",
        desc_en: "Aged blended Scotch, round and rich with deep oak notes.",
        price: 690000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Old Parr 12 Años",
        name_en: "Old Parr 12 Years",
        desc_es: "Blended escocés clásico, suave y equilibrado.",
        desc_en: "Classic blended Scotch, smooth and well-balanced.",
        price: 470000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Monkey Shoulder",
        name_en: "Monkey Shoulder",
        desc_es:
          "Blend de malta triple, suave y versátil para tomar solo o en cóctel.",
        desc_en:
          "Triple malt blend, smooth and versatile — neat or in a cocktail.",
        price: 350000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Glenfiddich 18 Años",
        name_en: "Glenfiddich 18 Years",
        desc_es: "Single malt añejado, notas a fruta madura y roble español.",
        desc_en: "Aged single malt, notes of ripe fruit and Spanish oak.",
        price: 1070000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Glenfiddich 15 Años",
        name_en: "Glenfiddich 15 Years",
        desc_es:
          "Single malt madurado en tres tipos de barrica, suave y especiado.",
        desc_en:
          "Single malt matured across three cask types, smooth and spiced.",
        price: 765000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Glenfiddich 12 Años",
        name_en: "Glenfiddich 12 Years",
        desc_es:
          "Single malt fresco y afrutado, el clásico de entrada de la casa.",
        desc_en: "Fresh, fruity single malt — the house's classic entry point.",
        price: 540000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "The Macallan 12 Años Double Cask",
        name_en: "The Macallan 12 Years Double Cask",
        desc_es:
          "Single malt madurado en doble barrica de jerez, notas a vainilla y especias dulces.",
        desc_en:
          "Single malt double-matured in sherry casks, notes of vanilla and sweet spice.",
        price: 780000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Buchanan's Máster",
        name_en: "Buchanan's Master",
        desc_es:
          "Blend escocés premium, suave y complejo, para paladares exigentes.",
        desc_en:
          "Premium Scotch blend, smooth and complex, for demanding palates.",
        price: 500000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Buchanan's 18 Años",
        name_en: "Buchanan's 18 Years",
        desc_es: "Blend escocés añejado, elegante y con un final largo.",
        desc_en: "Aged Scotch blend, elegant with a long finish.",
        price: 650000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Buchanan's 12 Años",
        name_en: "Buchanan's 12 Years",
        desc_es: "Blend escocés suave y accesible, ideal solo o en las rocas.",
        desc_en:
          "Smooth, approachable Scotch blend, great neat or on the rocks.",
        price: 480000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Bulleit Rye",
        name_en: "Bulleit Rye",
        desc_es:
          "Whiskey de centeno, especiado y con carácter — ideal en coctelería.",
        desc_en: "Rye whiskey, spiced and bold — great in cocktails.",
        price: 470000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Bulleit Bourbon",
        name_en: "Bulleit Bourbon",
        desc_es: "Bourbon con alto contenido de centeno, robusto y especiado.",
        desc_en: "High-rye bourbon, bold and spiced.",
        price: 425000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Chivas Regal 12 Años",
        name_en: "Chivas Regal 12 Years",
        desc_es: "Blended escocés clásico, suave, dulce y fácil de tomar.",
        desc_en: "Classic blended Scotch, smooth, sweet, and easy-drinking.",
        price: 360000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Jack Daniel's N°7",
        name_en: "Jack Daniel's N°7",
        desc_es:
          "Whiskey de Tennessee, filtrado en carbón — dulce y con carácter.",
        desc_en: "Tennessee whiskey, charcoal-mellowed — sweet with character.",
        price: 380000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Jack Daniel's Honey",
        name_en: "Jack Daniel's Honey",
        desc_es:
          "Whiskey de Tennessee con miel — dulce, suave y fácil de tomar.",
        desc_en:
          "Tennessee whiskey with honey — sweet, smooth, and easy-drinking.",
        price: 260000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Baileys Original",
        name_en: "Baileys Original",
        desc_es: "Crema de whiskey irlandés, dulce y aterciopelada.",
        desc_en: "Irish whiskey cream, sweet and velvety.",
        price: 190000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Buchanan's Pineapple",
        name_en: "Buchanan's Pineapple",
        desc_es:
          "Whisky escocés con infusión de piña — dulce, tropical y fácil de tomar.",
        desc_en:
          "Scotch whisky infused with pineapple — sweet, tropical, and easy-drinking.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Old Parr 12 Años",
        name_en: "Old Parr 12 Years",
        desc_es: "Blended escocés clásico, suave y equilibrado.",
        desc_en: "Classic blended Scotch, smooth and well-balanced.",
        price: 290000,
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
      {
        name_es: "Buchanan's 12 Años",
        name_en: "Buchanan's 12 Years",
        desc_es: "Blend escocés suave y accesible, ideal solo o en las rocas.",
        desc_en:
          "Smooth, approachable Scotch blend, great neat or on the rocks.",
        price: 240000,
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
    ],
  },
  {
    id: "rones",
    es: "Rones",
    en: "Rums",
    items: [
      {
        name_es: "Flor de Caña 12 Años",
        name_en: "Flor de Caña 12 Years",
        desc_es:
          "Ron nicaragüense añejado 12 años, notas a caramelo, roble y especias.",
        desc_en:
          "Nicaraguan rum aged 12 years, notes of caramel, oak, and spice.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Zacapa Centenario 23 Años",
        name_en: "Zacapa Centenario 23 Years",
        desc_es:
          "Ron guatemalteco de solera, madurado sobre las nubes — dulce, suave y aterciopelado.",
        desc_en:
          "Guatemalan solera rum, matured above the clouds — sweet, smooth, and velvety.",
        price: 55000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "La Hechicera",
        name_en: "La Hechicera",
        desc_es:
          "Ron colombiano premium, notas a fruta seca, cacao y especias.",
        desc_en:
          "Premium Colombian rum, notes of dried fruit, cacao, and spice.",
        price: 47000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Havana Club Especial",
        name_en: "Havana Club Especial",
        desc_es:
          "Ron cubano dorado, versátil — ideal solo o en coctelería clásica.",
        desc_en:
          "Golden Cuban rum, versatile — great neat or in classic cocktails.",
        price: 26000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Havana Club 3 Años",
        name_en: "Havana Club 3 Years",
        desc_es:
          "Ron cubano joven y ligero, perfecto para mojitos y highballs.",
        desc_en: "Young, light Cuban rum, perfect for mojitos and highballs.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Defensor Style 18 Años",
        name_en: "Defensor Style 18 Years",
        desc_es:
          "Ron añejado, robusto y con notas profundas a madera y especias.",
        desc_en: "Aged rum, bold with deep wood and spice notes.",
        price: 35000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Defensor Style 12 Años",
        name_en: "Defensor Style 12 Years",
        desc_es: "Ron añejado, suave y equilibrado, con notas a caramelo.",
        desc_en: "Aged rum, smooth and balanced, with caramel notes.",
        price: 28000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Ron Medellín 8 Años",
        name_en: "Ron Medellín 8 Years",
        desc_es:
          "Ron colombiano añejado, redondo y con notas a vainilla y roble.",
        desc_en: "Aged Colombian rum, round with vanilla and oak notes.",
        price: 29000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Ron Medellín 5 Años",
        name_en: "Ron Medellín 5 Years",
        desc_es: "Ron colombiano joven, suave y versátil.",
        desc_en: "Young Colombian rum, smooth and versatile.",
        price: 23000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Bacardi Carta Blanca",
        name_en: "Bacardi Carta Blanca",
        desc_es:
          "Ron blanco clásico, ligero y directo — la base de cualquier cóctel.",
        desc_en:
          "Classic white rum, light and clean — the base of any cocktail.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Ron Añejo 7 Años",
        name_en: "7-Year Aged Rum",
        desc_es: "Ron colombiano añejado, notas a caramelo y roble",
        desc_en: "Colombian aged rum, caramel and oak notes",
        price: 38000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Flor de Caña 12 Años",
        name_en: "Flor de Caña 12 Years",
        desc_es:
          "Ron nicaragüense añejado 12 años, notas a caramelo, roble y especias.",
        desc_en:
          "Nicaraguan rum aged 12 years, notes of caramel, oak, and spice.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Zacapa Centenario 23 Años",
        name_en: "Zacapa Centenario 23 Years",
        desc_es:
          "Ron guatemalteco de solera, madurado sobre las nubes — dulce, suave y aterciopelado.",
        desc_en:
          "Guatemalan solera rum, matured above the clouds — sweet, smooth, and velvety.",
        price: 870000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "La Hechicera",
        name_en: "La Hechicera",
        desc_es:
          "Ron colombiano premium, notas a fruta seca, cacao y especias.",
        desc_en:
          "Premium Colombian rum, notes of dried fruit, cacao, and spice.",
        price: 620000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Havana Club Especial",
        name_en: "Havana Club Especial",
        desc_es:
          "Ron cubano dorado, versátil — ideal solo o en coctelería clásica.",
        desc_en:
          "Golden Cuban rum, versatile — great neat or in classic cocktails.",
        price: 280000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Havana Club 3 Años",
        name_en: "Havana Club 3 Years",
        desc_es:
          "Ron cubano joven y ligero, perfecto para mojitos y highballs.",
        desc_en: "Young, light Cuban rum, perfect for mojitos and highballs.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Defensor Style 18 Años",
        name_en: "Defensor Style 18 Years",
        desc_es:
          "Ron añejado, robusto y con notas profundas a madera y especias.",
        desc_en: "Aged rum, bold with deep wood and spice notes.",
        price: 480000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Defensor Style 12 Años",
        name_en: "Defensor Style 12 Years",
        desc_es: "Ron añejado, suave y equilibrado, con notas a caramelo.",
        desc_en: "Aged rum, smooth and balanced, with caramel notes.",
        price: 350000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Ron Medellín Gran Solera 19 Años",
        name_en: "Ron Medellín Gran Solera 19 Years",
        desc_es:
          "Ron colombiano de gama alta, complejo y con crianza extendida.",
        desc_en: "High-end Colombian rum, complex with extended aging.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Ron Medellín 8 Años",
        name_en: "Ron Medellín 8 Years",
        desc_es:
          "Ron colombiano añejado, redondo y con notas a vainilla y roble.",
        desc_en: "Aged Colombian rum, round with vanilla and oak notes.",
        price: 260000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Ron Medellín 5 Años",
        name_en: "Ron Medellín 5 Years",
        desc_es: "Ron colombiano joven, suave y versátil.",
        desc_en: "Young Colombian rum, smooth and versatile.",
        price: 180000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Bacardi Carta Blanca",
        name_en: "Bacardi Carta Blanca",
        desc_es:
          "Ron blanco clásico, ligero y directo — la base de cualquier cóctel.",
        desc_en:
          "Classic white rum, light and clean — the base of any cocktail.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Ron Medellín 8 Años",
        name_en: "Ron Medellín 8 Years",
        desc_es:
          "Ron colombiano añejado, redondo y con notas a vainilla y roble.",
        desc_en: "Aged Colombian rum, round with vanilla and oak notes.",
        price: 145000,
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
      {
        name_es: "Ron Medellín 5 Años",
        name_en: "Ron Medellín 5 Years",
        desc_es: "Ron colombiano joven, suave y versátil.",
        desc_en: "Young Colombian rum, smooth and versatile.",
        price: 110000,
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
    ],
  },
  {
    id: "tequilas-mezcales",
    es: "Tequilas y Mezcales",
    en: "Tequilas & Mezcals",
    items: [
      {
        name_es: "Gran Centenario Reposado",
        name_en: "Gran Centenario Reposado",
        desc_es:
          "Tequila 100% agave reposado en barrica, suave y con notas a vainilla y roble.",
        desc_en:
          "100% agave tequila, barrel-rested, smooth with notes of vanilla and oak.",
        price: 28000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Gran Centenario Plata",
        name_en: "Gran Centenario Plata",
        desc_es: "Tequila 100% agave sin añejar — puro, fresco y directo.",
        desc_en:
          "100% agave tequila, unaged — pure, fresh, and straightforward.",
        price: 25000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Clase Azul Reposado",
        name_en: "Clase Azul Reposado",
        desc_es:
          "Tequila premium en su icónica botella de cerámica pintada a mano; reposado suave y elegante.",
        desc_en:
          "Premium tequila in its iconic hand-painted ceramic bottle; smooth, elegant reposado.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Don Julio 70",
        name_en: "Don Julio 70",
        desc_es:
          "Cristalino añejo, suave y ligeramente dulce — lo mejor de reposado y blanco.",
        desc_en:
          "Cristalino añejo, smooth and lightly sweet — the best of reposado and blanco.",
        price: 79000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Don Julio Añejo",
        name_en: "Don Julio Añejo",
        desc_es: "Tequila añejado, redondo y con notas a caramelo y roble.",
        desc_en: "Aged tequila, round with notes of caramel and oak.",
        price: 63000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Don Julio Reposado",
        name_en: "Don Julio Reposado",
        desc_es:
          "Tequila reposado suave y equilibrado, notas a agave cocido y vainilla.",
        desc_en:
          "Smooth, balanced reposado tequila, notes of cooked agave and vanilla.",
        price: 52000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Don Julio Blanco",
        name_en: "Don Julio Blanco",
        desc_es:
          "Tequila blanco puro y directo, notas cítricas y de agave fresco.",
        desc_en: "Pure, clean blanco tequila, citrus and fresh agave notes.",
        price: 45000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Maestro Dobel Diamante",
        name_en: "Maestro Dobel Diamante",
        desc_es:
          "Tequila cristalino, suave y versátil — mezcla de tres tequilas distintos.",
        desc_en:
          "Cristalino tequila, smooth and versatile — a blend of three different tequilas.",
        price: 55000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "1800 Reposado",
        name_en: "1800 Reposado",
        desc_es: "Tequila reposado suave, notas a vainilla y especias dulces.",
        desc_en: "Smooth reposado tequila, notes of vanilla and sweet spice.",
        price: 36000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "1800 Añejo",
        name_en: "1800 Añejo",
        desc_es: "Tequila añejado con cuerpo, notas a roble y caramelo.",
        desc_en: "Full-bodied aged tequila, notes of oak and caramel.",
        price: 36000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Unión El Joven",
        name_en: "Unión El Joven",
        desc_es: "Mezcal joven artesanal, ahumado y con carácter herbal.",
        desc_en: "Artisanal young mezcal, smoky with herbal character.",
        price: 34000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Montelobos",
        name_en: "Montelobos",
        desc_es: "Mezcal artesanal de espadín, ahumado y terroso.",
        desc_en: "Artisanal espadín mezcal, smoky and earthy.",
        price: 42000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "400 Conejos Joven Espadín",
        name_en: "400 Conejos Joven Espadín",
        desc_es: "Mezcal joven de espadín, ahumado y fresco.",
        desc_en: "Young espadín mezcal, smoky and fresh.",
        price: 65000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Tequila Reposado",
        name_en: "Reposado Tequila",
        desc_es: "100% agave, añejado en barrica, servido en caballito",
        desc_en: "100% agave, barrel-aged, served in a caballito shot",
        price: 40000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Mezcal Artesanal",
        name_en: "Artisanal Mezcal",
        desc_es: "Ahumado, servido solo con naranja y sal de gusano",
        desc_en: "Smoky, served neat with orange and worm salt",
        price: 44000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Gran Centenario Reposado",
        name_en: "Gran Centenario Reposado",
        desc_es:
          "Tequila 100% agave reposado en barrica, suave y con notas a vainilla y roble.",
        desc_en:
          "100% agave tequila, barrel-rested, smooth with notes of vanilla and oak.",
        price: 280000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Gran Centenario Plata",
        name_en: "Gran Centenario Plata",
        desc_es: "Tequila 100% agave sin añejar — puro, fresco y directo.",
        desc_en:
          "100% agave tequila, unaged — pure, fresh, and straightforward.",
        price: 260000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Clase Azul Reposado",
        name_en: "Clase Azul Reposado",
        desc_es:
          "Tequila premium en su icónica botella de cerámica pintada a mano; reposado suave y elegante.",
        desc_en:
          "Premium tequila in its iconic hand-painted ceramic bottle; smooth, elegant reposado.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Don Julio 70",
        name_en: "Don Julio 70",
        desc_es:
          "Cristalino añejo, suave y ligeramente dulce — lo mejor de reposado y blanco.",
        desc_en:
          "Cristalino añejo, smooth and lightly sweet — the best of reposado and blanco.",
        price: 890000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Don Julio Añejo",
        name_en: "Don Julio Añejo",
        desc_es: "Tequila añejado, redondo y con notas a caramelo y roble.",
        desc_en: "Aged tequila, round with notes of caramel and oak.",
        price: 740000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Don Julio Reposado",
        name_en: "Don Julio Reposado",
        desc_es:
          "Tequila reposado suave y equilibrado, notas a agave cocido y vainilla.",
        desc_en:
          "Smooth, balanced reposado tequila, notes of cooked agave and vanilla.",
        price: 640000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Don Julio Blanco",
        name_en: "Don Julio Blanco",
        desc_es:
          "Tequila blanco puro y directo, notas cítricas y de agave fresco.",
        desc_en: "Pure, clean blanco tequila, citrus and fresh agave notes.",
        price: 580000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Maestro Dobel Diamante",
        name_en: "Maestro Dobel Diamante",
        desc_es:
          "Tequila cristalino, suave y versátil — mezcla de tres tequilas distintos.",
        desc_en:
          "Cristalino tequila, smooth and versatile — a blend of three different tequilas.",
        price: 790000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "1800 Reposado",
        name_en: "1800 Reposado",
        desc_es: "Tequila reposado suave, notas a vainilla y especias dulces.",
        desc_en: "Smooth reposado tequila, notes of vanilla and sweet spice.",
        price: 480000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "1800 Añejo",
        name_en: "1800 Añejo",
        desc_es: "Tequila añejado con cuerpo, notas a roble y caramelo.",
        desc_en: "Full-bodied aged tequila, notes of oak and caramel.",
        price: 540000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Unión El Joven",
        name_en: "Unión El Joven",
        desc_es: "Mezcal joven artesanal, ahumado y con carácter herbal.",
        desc_en: "Artisanal young mezcal, smoky with herbal character.",
        price: 430000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Montelobos",
        name_en: "Montelobos",
        desc_es: "Mezcal artesanal de espadín, ahumado y terroso.",
        desc_en: "Artisanal espadín mezcal, smoky and earthy.",
        price: 530000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "400 Conejos Joven Espadín",
        name_en: "400 Conejos Joven Espadín",
        desc_es: "Mezcal joven de espadín, ahumado y fresco.",
        desc_en: "Young espadín mezcal, smoky and fresh.",
        price: 550000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
    ],
  },
  {
    id: "vodkas",
    es: "Vodkas",
    en: "Vodkas",
    items: [
      {
        name_es: "Vodka Premium",
        name_en: "Premium Vodka",
        desc_es: "Destilación múltiple, servido helado",
        desc_en: "Multiple-distilled, served ice cold",
        price: 36000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Grey Goose Original",
        name_en: "Grey Goose Original",
        desc_es: "Vodka francés premium, destilación suave y cristalina.",
        desc_en: "Premium French vodka, smooth, crystal-clean distillation.",
        price: 40000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Absolut Original",
        name_en: "Absolut Original",
        desc_es: "Vodka sueco clásico, limpio y versátil.",
        desc_en: "Classic Swedish vodka, clean and versatile.",
        price: 25000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Smirnoff N°21",
        name_en: "Smirnoff N°21",
        desc_es: "Vodka triple destilado, suave y neutro.",
        desc_en: "Triple-distilled vodka, smooth and neutral.",
        price: 31000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Smirnoff Tamarindo",
        name_en: "Smirnoff Tamarind",
        desc_es: "Vodka saborizado con tamarindo — dulce, ácido y tropical.",
        desc_en: "Tamarind-flavored vodka — sweet, tart, and tropical.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Ciroc Original",
        name_en: "Ciroc Original",
        desc_es: "Vodka francés destilado de uvas, fino y aromático.",
        desc_en: "French grape-distilled vodka, refined and aromatic.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Grey Goose Original",
        name_en: "Grey Goose Original",
        desc_es: "Vodka francés premium, destilación suave y cristalina.",
        desc_en: "Premium French vodka, smooth, crystal-clean distillation.",
        price: 550000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Absolut Original",
        name_en: "Absolut Original",
        desc_es: "Vodka sueco clásico, limpio y versátil.",
        desc_en: "Classic Swedish vodka, clean and versatile.",
        price: 280000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Absolut 350 ml",
        name_en: "Absolut 350 ml",
        desc_es: "Vodka sueco clásico, formato personal.",
        desc_en: "Classic Swedish vodka, personal-size bottle.",
        price: 160000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Smirnoff N°21",
        name_en: "Smirnoff N°21",
        desc_es: "Vodka triple destilado, suave y neutro.",
        desc_en: "Triple-distilled vodka, smooth and neutral.",
        price: 230000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Smirnoff Tamarindo",
        name_en: "Smirnoff Tamarind",
        desc_es: "Vodka saborizado con tamarindo — dulce, ácido y tropical.",
        desc_en: "Tamarind-flavored vodka — sweet, tart, and tropical.",
        price: 140000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Ciroc Original",
        name_en: "Ciroc Original",
        desc_es: "Vodka francés destilado de uvas, fino y aromático.",
        desc_en: "French grape-distilled vodka, refined and aromatic.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
    ],
  },
  {
    id: "ginebras",
    es: "Ginebras",
    en: "Gins",
    items: [
      {
        name_es: "Tanqueray London Dry",
        name_en: "Tanqueray London Dry",
        desc_es:
          "Gin botánico, seco y directo — el clásico en su máxima expresión.",
        desc_en:
          "Botanical, dry gin, straight to the point — the classic at its best.",
        price: 45000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Tanqueray No. Ten",
        name_en: "Tanqueray No. Ten",
        desc_es:
          "Gin floral y suave, con un guiño cítrico que lo hace inconfundible.",
        desc_en:
          "Floral, smooth gin with a citrus wink that makes it unmistakable.",
        price: 53000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Bombay Sapphire",
        name_en: "Bombay Sapphire",
        desc_es:
          "Gin aromático y equilibrado, para quienes disfrutan los detalles.",
        desc_en: "Aromatic, balanced gin, for those who savor the details.",
        price: 39000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Monkey 47",
        name_en: "Monkey 47",
        desc_es:
          "Gin intenso y especiado — carácter puro para los paladares más exigentes.",
        desc_en:
          "Intense, spiced gin — pure character for the most demanding palates.",
        price: 78000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Hendrick's",
        name_en: "Hendrick's",
        desc_es:
          "Gin fresco y floral, una experiencia sensorial distinta a cualquier otra.",
        desc_en: "Fresh, floral gin — a sensory experience unlike any other.",
        price: 55000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Tanqueray London Dry",
        name_en: "Tanqueray London Dry",
        desc_es:
          "Gin botánico, seco y directo — el clásico en su máxima expresión.",
        desc_en:
          "Botanical, dry gin, straight to the point — the classic at its best.",
        price: 420000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Tanqueray No. Ten",
        name_en: "Tanqueray No. Ten",
        desc_es:
          "Gin floral y suave, con un guiño cítrico que lo hace inconfundible.",
        desc_en:
          "Floral, smooth gin with a citrus wink that makes it unmistakable.",
        price: 610000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Bombay Sapphire",
        name_en: "Bombay Sapphire",
        desc_es:
          "Gin aromático y equilibrado, para quienes disfrutan los detalles.",
        desc_en: "Aromatic, balanced gin, for those who savor the details.",
        price: 480000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Monkey 47",
        name_en: "Monkey 47",
        desc_es:
          "Gin intenso y especiado — carácter puro para los paladares más exigentes.",
        desc_en:
          "Intense, spiced gin — pure character for the most demanding palates.",
        price: 720000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Hendrick's",
        name_en: "Hendrick's",
        desc_es:
          "Gin fresco y floral, una experiencia sensorial distinta a cualquier otra.",
        desc_en: "Fresh, floral gin — a sensory experience unlike any other.",
        price: 580000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
    ],
  },
  {
    id: "aguardiente",
    es: "Aguardiente",
    en: "Aguardiente",
    items: [
      {
        name_es: "Antioqueño Verde",
        name_en: "Antioqueño Verde",
        desc_es: "Aguardiente antioqueño tradicional, anisado y directo.",
        desc_en:
          "Traditional Antioquia aguardiente, anise-forward and straightforward.",
        price: 15000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Antioqueño Real Negro",
        name_en: "Antioqueño Real Negro",
        desc_es: "Aguardiente de sello negro, más suave y ligeramente dulce.",
        desc_en: "Black-seal aguardiente, smoother and lightly sweet.",
        price: 17000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Antioqueño Rojo",
        name_en: "Antioqueño Rojo",
        desc_es: "Aguardiente sin azúcar, seco y directo.",
        desc_en: "Sugar-free aguardiente, dry and straightforward.",
        price: 15000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Antioqueño Azul (Tapa Azul)",
        name_en: "Antioqueño Azul",
        desc_es: "Aguardiente sin azúcar de baja graduación, suave y ligero.",
        desc_en: "Low-proof, sugar-free aguardiente, light and smooth.",
        price: 15000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Antioqueño Verde",
        name_en: "Antioqueño Verde",
        desc_es: "Aguardiente antioqueño tradicional, anisado y directo.",
        desc_en:
          "Traditional Antioquia aguardiente, anise-forward and straightforward.",
        price: 180000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Antioqueño Real Negro",
        name_en: "Antioqueño Real Negro",
        desc_es: "Aguardiente de sello negro, más suave y ligeramente dulce.",
        desc_en: "Black-seal aguardiente, smoother and lightly sweet.",
        price: 200000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Antioqueño Rojo",
        name_en: "Antioqueño Rojo",
        desc_es: "Aguardiente sin azúcar, seco y directo.",
        desc_en: "Sugar-free aguardiente, dry and straightforward.",
        price: 180000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Antioqueño Azul",
        name_en: "Antioqueño Azul",
        desc_es: "Aguardiente sin azúcar de baja graduación, suave y ligero.",
        desc_en: "Low-proof, sugar-free aguardiente, light and smooth.",
        price: 190000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Antioqueño Verde",
        name_en: "Antioqueño Verde",
        desc_es: "Aguardiente antioqueño tradicional, anisado y directo.",
        desc_en:
          "Traditional Antioquia aguardiente, anise-forward and straightforward.",
        price: 100000,
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
      {
        name_es: "Antioqueño Rojo",
        name_en: "Antioqueño Rojo",
        desc_es: "Aguardiente sin azúcar, seco y directo.",
        desc_en: "Sugar-free aguardiente, dry and straightforward.",
        price: 100000,
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
      {
        name_es: "Antioqueño Azul",
        name_en: "Antioqueño Azul",
        desc_es: "Aguardiente sin azúcar de baja graduación, suave y ligero.",
        desc_en: "Low-proof, sugar-free aguardiente, light and smooth.",
        price: 100000,
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
    ],
  },
  {
    id: "otros-licores",
    es: "Otros Licores",
    en: "Other Spirits & Liqueurs",
    items: [
      {
        name_es: "Jägermeister",
        name_en: "Jägermeister",
        desc_es:
          "Licor de hierbas alemán, intenso y con carácter — el infaltable de la noche.",
        desc_en:
          "German herbal liqueur, bold and full of character — a night-out staple.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Disaronno",
        name_en: "Disaronno",
        desc_es:
          "Licor italiano de almendras, dulce y aromático — solo, en las rocas o en cóctel.",
        desc_en:
          "Italian almond liqueur, sweet and aromatic — neat, on the rocks, or in a cocktail.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Hennessy",
        name_en: "Hennessy",
        desc_es: "Cognac francés, redondo y con notas a fruta madura y roble.",
        desc_en: "French cognac, round with notes of ripe fruit and oak.",
        price: 45000,
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Jägermeister",
        name_en: "Jägermeister",
        desc_es:
          "Licor de hierbas alemán, intenso y con carácter — el infaltable de la noche.",
        desc_en:
          "German herbal liqueur, bold and full of character — a night-out staple.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Disaronno",
        name_en: "Disaronno",
        desc_es:
          "Licor italiano de almendras, dulce y aromático — solo, en las rocas o en cóctel.",
        desc_en:
          "Italian almond liqueur, sweet and aromatic — neat, on the rocks, or in a cocktail.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Hennessy",
        name_en: "Hennessy",
        desc_es: "Cognac francés, redondo y con notas a fruta madura y roble.",
        desc_en: "French cognac, round with notes of ripe fruit and oak.",
        price: 600000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Cointreau",
        name_en: "Cointreau",
        desc_es:
          "Licor francés de naranja, seco y aromático — clave en la coctelería clásica.",
        desc_en:
          "French orange liqueur, dry and aromatic — a classic-cocktail essential.",
        price: 320000,
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Triple Sec Convier",
        name_en: "Triple Sec Convier",
        desc_es: "Licor de naranja, dulce y versátil para coctelería.",
        desc_en: "Orange liqueur, sweet and versatile for cocktails.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Triple Sec Azul Convier",
        name_en: "Blue Triple Sec Convier",
        desc_es: "Licor de naranja con curazao azul — dulce y vibrante.",
        desc_en: "Orange liqueur with blue curaçao — sweet and vibrant.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Limoncello Villa Massa",
        name_en: "Limoncello Villa Massa",
        desc_es: "Licor italiano de limón, dulce, cítrico y refrescante.",
        desc_en: "Italian lemon liqueur, sweet, citrusy, and refreshing.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Jägermeister",
        name_en: "Jägermeister",
        desc_es:
          "Licor de hierbas alemán, intenso y con carácter — el infaltable de la noche.",
        desc_en:
          "German herbal liqueur, bold and full of character — a night-out staple.",
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
      {
        name_es: "Viche Curao del Río",
        name_en: "Viche Curao del Río",
        desc_es:
          "Viche del Pacífico colombiano curado con frutas y hierbas de la región — historia y tradición en cada trago.",
        desc_en:
          "Pacific-coast Colombian viche cured with regional fruits and herbs — history and tradition in every pour.",
        subcategory_es: "Shots",
        subcategory_en: "Shots",
      },
      {
        name_es: "Viche Curao del Río",
        name_en: "Viche Curao del Río",
        desc_es:
          "Viche del Pacífico colombiano curado con frutas y hierbas de la región — historia y tradición en cada trago.",
        desc_en:
          "Pacific-coast Colombian viche cured with regional fruits and herbs — history and tradition in every pour.",
        subcategory_es: "Botellas",
        subcategory_en: "Bottles",
      },
      {
        name_es: "Viche Curao del Río",
        name_en: "Viche Curao del Río",
        desc_es:
          "Viche del Pacífico colombiano curado con frutas y hierbas de la región — historia y tradición en cada trago.",
        desc_en:
          "Pacific-coast Colombian viche cured with regional fruits and herbs — history and tradition in every pour.",
        subcategory_es: "Media Botella",
        subcategory_en: "Half Bottle",
      },
    ],
  },
  {
    id: "cervezas",
    es: "Cervezas",
    en: "Beers",
    items: [
      {
        name_es: "Club Colombia",
        name_en: "Club Colombia",
        desc_es: "Cerveza colombiana clásica, ligera y fácil de tomar.",
        desc_en: "Classic Colombian lager, light and easy-drinking.",
        price: 15000,
      },
      {
        name_es: "Corona",
        name_en: "Corona",
        desc_es:
          "Cerveza mexicana clara, ligera y refrescante — ideal con limón.",
        desc_en: "Mexican pale lager, light and refreshing — great with lime.",
        price: 18000,
      },
      {
        name_es: "Stella Artois",
        name_en: "Stella Artois",
        desc_es: "Lager belga, dorada y de sabor equilibrado.",
        desc_en: "Belgian lager, golden with a balanced flavor.",
        price: 18000,
      },
      {
        name_es: "Michelob Ultra",
        name_en: "Michelob Ultra",
        desc_es: "Cerveza ligera y baja en calorías, fácil de tomar.",
        desc_en: "Light, low-calorie beer, easy-drinking.",
        price: 18000,
      },
      {
        name_es: "Schöfferhofer",
        name_en: "Schöfferhofer",
        desc_es: "Cerveza de trigo alemana con toque cítrico refrescante.",
        desc_en: "German wheat beer with a refreshing citrus twist.",
        price: 22000,
      },
      {
        name_es: "Estrella Galicia Especial",
        name_en: "Estrella Galicia Especial",
        desc_es: "Lager española premium, notas maltosas y final limpio.",
        desc_en: "Premium Spanish lager, malty notes and a clean finish.",
        price: 22000,
      },
      {
        name_es: "Erdinger Weissbier",
        name_en: "Erdinger Weissbier",
        desc_es: "Cerveza de trigo alemana, afrutada y con espuma cremosa.",
        desc_en: "German wheat beer, fruity with a creamy head.",
        price: 32000,
      },
      {
        name_es: "Innis & Gunn Caribbean Rum Cask",
        name_en: "Innis & Gunn Caribbean Rum Cask",
        desc_es:
          "Cerveza escocesa madurada en barricas de ron caribeño — dulce y con notas a roble.",
        desc_en:
          "Scottish beer aged in Caribbean rum casks — sweet with oak notes.",
        price: 32000,
      },
      {
        name_es: "Duff",
        name_en: "Duff",
        desc_es: "Lager clásica, ligera y fácil de tomar.",
        desc_en: "Classic lager, light and easy-drinking.",
        price: 18000,
      },
    ],
  },
  {
    id: "aguas-gaseosas",
    es: "Aguas y Gaseosas",
    en: "Waters & Sodas",
    items: [
      {
        name_es: "Agua Con Gas",
        name_en: "Sparkling Water",
        desc_es: "Botella individual, ideal para acompañar cualquier trago.",
        desc_en: "Individual bottle, great alongside any drink.",
        price: 10000,
      },
      {
        name_es: "Agua Sin Gas",
        name_en: "Still Water",
        desc_es: "Botella individual.",
        desc_en: "Individual bottle.",
        price: 10000,
      },
      {
        name_es: "Coca-Cola",
        name_en: "Coca-Cola",
        desc_es: "Personal.",
        desc_en: "Personal size.",
        price: 10000,
      },
      {
        name_es: "Coca-Cola Zero",
        name_en: "Coca-Cola Zero",
        desc_es: "Personal.",
        desc_en: "Personal size.",
        price: 10000,
      },
      {
        name_es: "Sprite",
        name_en: "Sprite",
        desc_es: "Personal.",
        desc_en: "Personal size.",
        price: 10000,
      },
      {
        name_es: "Soda Bretaña",
        name_en: "Soda Bretaña",
        desc_es: "Personal.",
        desc_en: "Personal size.",
        price: 10000,
      },
    ],
  },
  {
    id: "bebidas-mixers",
    es: "Bebidas y Mixers",
    en: "Mixers & Soft Drinks",
    items: [
      {
        name_es: "Red Bull",
        name_en: "Red Bull",
        desc_es: "Energizante para acompañar tu trago.",
        desc_en: "Energy drink to mix with your spirit.",
      },
      {
        name_es: "Gatorade",
        name_en: "Gatorade",
        desc_es: "Bebida hidratante, ideal para refrescar entre tragos.",
        desc_en: "Sports drink, great for refreshing between rounds.",
      },
      {
        name_es: "Canada Dry",
        name_en: "Canada Dry",
        desc_es: "Ginger ale burbujeante, el mixer clásico para whisky y ron.",
        desc_en: "Bubbly ginger ale, the classic mixer for whisky and rum.",
      },
      {
        name_es: "Servicio de Michelada",
        name_en: "Michelada Service",
        desc_es:
          "Preparación michelada para tu cerveza — sal, limón y salsas de la casa.",
        desc_en: "Michelada prep for your beer — salt, lime, and house sauces.",
        price: 5000,
      },
      {
        name_es: "Adición de Shot o Licor",
        name_en: "Extra Shot or Liquor Add-On",
        desc_es: "Suma un shot o licor extra a tu cóctel o bebida.",
        desc_en: "Add an extra shot or liquor to your cocktail or drink.",
        price: 23000,
      },
    ],
  },
  {
    id: "cafe",
    es: "Café",
    en: "Coffee",
    items: [
      {
        name_es: "Café Espresso",
        name_en: "Espresso",
        desc_es: "Café espresso intenso y concentrado, tal como debe ser.",
        desc_en: "Bold, concentrated espresso, exactly as it should be.",
        price: 7000,
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
      {
        name_es: "Café Americano",
        name_en: "Americano",
        desc_es: "Espresso alargado con agua caliente — suave y aromático.",
        desc_en: "Espresso lengthened with hot water — smooth and aromatic.",
        price: 8000,
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
      {
        name_es: "Café Latte",
        name_en: "Latte",
        desc_es: "Espresso con leche vaporizada — cremoso y equilibrado.",
        desc_en: "Espresso with steamed milk — creamy and balanced.",
        price: 12000,
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
      {
        name_es: "Café Capuchino",
        name_en: "Cappuccino",
        desc_es:
          "Espresso, leche vaporizada y espuma en proporciones clásicas.",
        desc_en: "Espresso, steamed milk, and foam in classic proportions.",
        price: 14000,
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
      {
        name_es: "Café Capuchino Baileys",
        name_en: "Baileys Cappuccino",
        desc_es: "Capuchino clásico con un toque de crema de whiskey Baileys.",
        desc_en: "Classic cappuccino with a splash of Baileys Irish cream.",
        price: 25000,
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
      {
        name_es: "Cold Brew",
        name_en: "Cold Brew",
        desc_es: "Café frío de extracción lenta, suave e intenso en sabor.",
        desc_en: "Slow-extracted cold brew coffee, smooth and full-flavored.",
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
      {
        name_es: "Cold Brew Latte",
        name_en: "Cold Brew Latte",
        desc_es:
          "Cold brew con un toque cremoso de leche — suave y equilibrado.",
        desc_en: "Cold brew with a creamy touch of milk — smooth and balanced.",
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
      {
        name_es: "Cold Brew Soda",
        name_en: "Cold Brew Soda",
        desc_es:
          "Cold brew refrescado con soda — ligero, burbujeante y con toda la fuerza del café.",
        desc_en:
          "Cold brew topped with soda — light, fizzy, and full of coffee kick.",
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
      {
        name_es: "Cold Brew Naranja",
        name_en: "Orange Cold Brew",
        desc_es:
          "Cold brew con un giro cítrico de naranja — combinación inesperada y refrescante.",
        desc_en:
          "Cold brew with a citrusy orange twist — an unexpected, refreshing combo.",
        subcategory_es: "Café",
        subcategory_en: "Coffee",
      },
    ],
  },
];
