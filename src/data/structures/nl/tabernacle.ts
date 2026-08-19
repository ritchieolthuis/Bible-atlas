import type { Structure } from "@/types/structure";

export const tabernacle: Structure = {
  id: "tabernacle",
  name: "De Tabernakel van Mozes",
  dwelling: "De Tent der Samenkomst",
  subtitle: "Het Heiligdom in de Woestijn",
  description: "De draagbare aardse woonplaats des Heeren, door Mozes gebouwd in de woestijn naar het voorbeeld dat hem op den berg getoond werd, met Bezaleël als hoofdambachtsman en de ark der getuigenis in het heilige der heiligen. SV-tekst: \"En zij zullen Mij een heiligdom maken, dat Ik in het midden van hen wone.\", Exodus 25:8 (SV)",
  modelPath: "/models/tabernacle.glb?v=2",
  modelVariants: [
    { id: "default", label: "Standaard", path: "/models/tabernacle.glb?v=2" },
    { id: "inside", label: "Binnenkant", path: "/models/tabernacle_inside.glb?v=3",
      // A separate export, turned a quarter turn and framed on the court, so
      // the default anchors land in the wrong places here. Measured against
      // this model's own geometry.
      // The default exterior azimuth (-45) shows the back of this reoriented
      // export; +135 (a half turn from -45) faces the front/entrance side instead.
      camera: { azimuth: 135, elevation: 25, dist: 0.75, targetY: 0.3 },
      anchors: {
        curtains: [0.428, 0.96, 0.346],
        brazen_altar: [0.685, 0.30, 0.635],
        laver: [0.421, 0.29, 0.529],
        // the gate screen and the perimeter fence are exterior-only
        // features of the court; this cutaway is framed on the tent's
        // interior, so both are hidden here rather than mis-pinned
        court_gate: null,
        court_hangings: null,
      },
    }
  ],
  descriptionLinks: [
    { text: "Bezaleël", target: { kind: "section", section: "artifacts" } },
    { text: "de ark der getuigenis", target: { kind: "section", section: "artifacts" } },
    { text: "het heilige der heiligen", target: { kind: "section", section: "interior" } },
  ],
  tint: "#a47864",
  camera: { azimuth: -45, elevation: 30, dist: 0.78, targetY: 0.3 },
  facts: [
    { label: "Periode", value: "De uittocht", icon: "period" },
    { label: "Regio", value: "De woestijn Sinaï", icon: "region" },
    { label: "Materialen", value: "Sittimhout, goud, zilver, koper, linnen", icon: "materials" },
    { label: "Onderscheidend kenmerk", value: "Gordijnen van fijn getweernd linnen", icon: "feature" },
    { label: "Typische bewoners", value: "Aäron en zijn zonen", icon: "occupants" },
  ],
  biblicalMeaning: "De tabernakel was Gods draagbare heiligdom te midden van een pelgrimerend volk, waarin door offer en priesterdienst een weg tot verzoening werd geopend, opdat de Heere, die anders ontoegankelijk woont, in het midden van een zondig volk wonen kon.",
  didYouKnow: "Elk deel der tabernakel werd naar een hemels voorbeeld gemaakt, dat Mozes op den berg getoond werd, en de kunstenaar Bezaleël werd door den Geest Gods vervuld met wijsheid en verstand om al het werk uit te voeren (Exodus 25:9, 31:2-3).",
  hotspots: [
    /* Anchors below are measured off tabernacle.glb itself, not estimated.
       Scene layout along z (Exodus 40:6-8, 30:18): gate at z~0.98, then the
       brazen altar (z~0.83), the laver (z~0.72), and the tent (z~0.40) with
       the most holy place at its far west end (z~0.19). */
    {
      id: "curtains",
      title: "De Tent der Samenkomst",
      short: "Tien gordijnen van fijn linnen en dassenvellen",
      detail: "Den tabernakel nu zult gij maken van tien gordijnen, van fijn getweernd linnen, en hemelsblauw, en purper, en scharlaken, met cherubim (Exodus 26:1).",
      category: "roof",
      // centre of the tent ridge, the highest point of the tent itself
      anchor: [0.56, 0.37, 0.40],
      snap: "none",
    },
    {
      id: "brazen_altar",
      title: "Het Brandofferaltaar",
      short: "Altaar van sittimhout, overtogen met koper",
      detail: "Hij maakte ook het brandofferaltaar van sittimhout; vijf ellen was deszelfs lengte, en vijf ellen zijn breedte, drie ellen zijn hoogte, en hij overtrok het met koper (Exodus 38:1-2).",
      category: "court",
      // on the altar's own frame, below the flame so the pin reads as the altar
      anchor: [0.4, 0.98, 0.83],
      snap: "none",
    },
    {
      id: "laver",
      title: "Het Koperen Wasvat",
      short: "Voor Aäron en zijn zonen om zich te wassen",
      detail: "Gij zult ook een koperen wasvat maken... en gij zult het zetten tussen de tent der samenkomst en tussen het altaar, en water daarin doen (Exodus 30:18).",
      category: "court",
      // the basin's own rim, between the tent and the altar as Exodus 30:18 has it
      anchor: [0.61, 0.23, 0.71],
      snap: "none",
    },
    {
      id: "court_gate",
      title: "De Poort van het Voorhof",
      short: "Gordijn van twintig ellen met borduurwerk",
      detail: "In de poort nu des voorhofs zal een deksel zijn van twintig ellen, hemelsblauw, en purper, en scharlaken, en fijn getweernd linnen, geborduurd werk (Exodus 27:16).",
      category: "entrance",
      // centre of the east screen, the one side the court is entered by
      anchor: [0.50, 0.20, 0.97],
      snap: "none",
    },
    {
      id: "court_hangings",
      title: "De Omheining des Voorhofs",
      short: "Hangende gordijnen van fijn getweernd linnen",
      detail: "Gij zult ook het voorhof des tabernakels maken... gordijnen voor het voorhof van fijn getweernd linnen (Exodus 27:9).",
      category: "court",
      // on the long north hanging, well away from the gate screen
      anchor: [0.02, 0.20, 0.45],
      snap: "none",
    },
  ],
  interior: {
    kicker: "Interieur",
    title: "Het Heilige",
    cta: "Verken het Interieur",
    text: "Voorbij het voorhof bevatte de linnen tent twee ruimten. In Het Heilige stond de gouden kandelaar aan de zuidzijde, om licht te geven; de tafel der toonbroden aan de noordzijde, met twaalf broden voortdurend voor het aangezicht des Heeren; en het reukaltaar voor den voorhang, waar elke morgen en avond welriekend reukwerk gebrand werd. Achter den voorhang lag het heilige der heiligen, slechts eenmaal per jaar door den hogepriester betreden, met de ark des verbonds onder het verzoendeksel en zijn twee kleine gouden cherubim. SV-tekst: \"Daarna zult gij de tafel daarin brengen, en gij zult schikken wat daarop te schikken is; gij zult ook den kandelaar daarin brengen, en zijn lampen aansteken.\", Exodus 40:4 (SV)",
    image: "/img/tabernacle/interior.webp",
  },
  floorPlan: {
    kicker: "Plattegrond",
    title: "Het Voorhof en de Tent",
    cta: "Bekijk Plattegrond",
    text: "Wie het voorhof binnenkwam, ontmoette eerst het koperen brandofferaltaar, waar offers voor de zonde door vuur verteerd werden, en daarachter het koperen wasvat, waar de priesters hun handen en voeten wiesen voor zij dienden. Alleen priesters mochten verder, de linnen tent zelf in. SV-tekst: \"De lengte des voorhofs zal honderd ellen zijn, en de breedte doorgaans vijftig, en de hoogte vijf ellen, van fijn getweernd linnen; maar hun voeten zullen van koper zijn.\", Exodus 27:18 (SV)",
    image: "/img/tabernacle/floor-plan.webp",
    rooms: [
      { name: "Het Voorhof", note: "Honderd ellen lang, vijftig ellen breed, omringd door twintig pilaren aan elke lange zijde, gezet in koperen voeten" },
      { name: "Het Heilige", note: "Met de kandelaar, de tafel en het reukaltaar" },
      { name: "Het Heilige der Heiligen", note: "Met de ark der getuigenis" },
      { name: "De Berderen", note: "Twintig berderen aan de zuidzijde, twintig aan de noordzijde en zes aan de westzijde, elk tien ellen hoog en anderhalve el breed" },
      { name: "Het Geitenharen Dekkleed", note: "Elf gordijnen van geitenhaar, dertig bij vier ellen, over de linnen gordijnen heen gelegd als een tent" },
    ],
  },
  artifacts: {
    kicker: "Heilige Voorwerpen",
    title: "De Heilige Vaten",
    cta: "Verken de Voorwerpen",
    text: "Het volk bracht zoveel vrijwillige offeranden, goud, zilver, koper, sittimhout, kostelijke stenen, dat Mozes hun moest gebieden te stoppen met brengen, want er was meer dan genoeg voor al het werk (Ex. 36:5-7). God vervulde Bezaleël van den stam Juda met Zijn Geest, in wijsheid, verstand en wetenschap, om al het kunstwerk te bedenken en te maken. SV-tekst: \"Toen wrocht Bezaleël en Aholiab, en alle man, die wijs van hart was, in denwelken de Heere wijsheid en verstand gegeven had, om te weten alle werk te maken, naar alles wat de Heere geboden had.\", Exodus 36:1 (SV)",
    image: "/img/tabernacle/holy_vessels.png",
    items: [
      { name: "Ark der Getuigenis", purpose: "Om de getuigenis te bevatten", material: "Sittimhout, overtogen met goud", context: "Twee ellen en een halve lang, anderhalve el breed en anderhalve el hoog, geplaatst binnen den voorhang, in het heilige der heiligen." },
      { name: "Verzoendeksel", purpose: "Bedekking van de ark", material: "Louter goud", context: "Met twee gouden cherubim aan de beide einden." },
      { name: "Kandelaar", purpose: "Om licht te geven", material: "Louter goud, één talent zwaar", context: "Drijfwerk met zes rieten uitgaande uit de zijden, plus de middelste schacht, zeven lampen in totaal." },
      { name: "Tafel der Toonbroden", purpose: "Om de toonbroden te dragen", material: "Sittimhout, overtogen met goud", context: "Twee ellen lang, een el breed en anderhalve el hoog, geplaatst aan de noordzijde van de tabernakel." },
      { name: "Reukaltaar", purpose: "Om reukwerk op te branden", material: "Sittimhout, overtogen met goud", context: "Een el lang, een el breed en twee ellen hoog, geplaatst voor den voorhang." },
      { name: "Wasvat", purpose: "Om te wassen", material: "Koper", context: "Tussen de tent der samenkomst en het altaar." },
    ],
  },
  dailyLife: {
    kicker: "Eredienst",
    title: "Dienst der Priesters",
    cta: "Ontdek het Dagelijks Leven",
    text: "Elke morgen en avond offerden de priesters een lam ten brandoffer, een gedurig offer voor alle geslachten (Ex. 29:38-42). Het heilige der heiligen mocht door niemand betreden worden dan door den hogepriester alleen, en dat slechts eenmaal in het jaar, op den Grote Verzoendag, met bloed voor zijn eigen zonden en die des volks (Lev. 16:2, 34). Wanneer de wolk van boven de tabernakel optrok, reisde Israël verder; bleef zij rusten, dan legerden zij zich, bij dag een wolk, bij nacht een vuur, voor de ogen van geheel het huis Israëls. SV-tekst: \"Wanneer zij in de tent der samenkomst zullen gaan, zo zullen zij zich met water wassen, opdat zij niet sterven; of wanneer zij tot het altaar naderen, om te dienen...\", Exodus 30:20 (SV)",
    image: "/img/tabernacle/service_of_the_priests.png",
  },
  geography: {
    kicker: "Waar het Bestond",
    title: "De Reis door de Woestijn",
    cta: "Verken de Kaart",
    text: "Rondom de tabernakel legerden zich de twaalf stammen in een vaste orde naar de vier windstreken, Juda ten oosten, Ruben ten zuiden, Efraïm ten westen, Dan ten noorden, met de Levieten er onmiddellijk omheen, tussen het volk en het heiligdom, zodat geen vreemde te na kwam (Num. 2:1-31). De tabernakel was ontworpen om draagbaar te zijn, gedragen door de Levieten terwijl de kinderen Israëls door de woestijn reisden, een tocht die begon in Rameses, terstond na het pascha, met omtrent zeshonderdduizend man te voet (Ex. 12:37; Num. 33:3), en eindigde na veertig jaren in de vlakten van Moab, aan de Jordaan tegenover Jericho (Num. 33:48-49). Daar ging Mozes op uit de vlakten van Moab, op den berg Nebo, op den top van Pisga; en de Heere toonde hem het ganse land, en Mozes stierf aldaar, honderd en twintig jaren oud, zonder zelf het beloofde land binnen te gaan (Deut. 34:1-7). SV-tekst: \"Maar gij, stel de Levieten over den tabernakel der getuigenis, en over al zijn gereedschap... zij zullen den tabernakel dragen, en al zijn gereedschap; en zij zullen dien bedienen, en zij zullen zich rondom den tabernakel legeren.\", Numeri 1:50 (SV)",
    image: "/img/tabernacle/map.webp",
    regionLabel: "Van Rameses tot den berg Nebo",
  },
  lesson: {
    title: "Het Voorbeeld op den Berg",
    intro: "Gods gedetailleerde aanwijzingen aan Mozes voor de bouw van het heiligdom.",
    blocks: [
      { heading: "Gods Verlangen", body: "En zij zullen Mij een heiligdom maken, dat Ik in het midden van hen wone. SV: Exodus 25:8" },
      { heading: "Het Vrijwillig Offer", body: "Spreek tot de kinderen Israëls, dat zij Mij een hefoffer brengen; van een ieder, die het uit vrijwilligheid zijns harten geeft, zult gij Mijn hefoffer nemen." },
      { heading: "Het Voorbeeld", body: "Naar al wat Ik u tot een voorbeeld des tabernakels, en een voorbeeld van al deszelfs gereedschap wijzen zal, even alzo zult gijlieden dat maken." },
      { heading: "De Werklieden", body: "Zie, Ik heb met name geroepen Bezaleël, den zoon van Uri... en Ik heb hem vervuld met den Geest Gods, met wijsheid, en met verstand, en met wetenschap." },
      { heading: "De Berderen", body: "Gij zult ook aan den tabernakel berderen maken van staand sittimhout... tien ellen zal de lengte van een berd zijn." },
      { heading: "De Dekkleden", body: "Gij zult ook voor de tent een deksel maken van roodgeverfde ramsvellen, en daarboven een deksel van dassenvellen." },
      { heading: "De Heerlijkheid des Heeren", body: "Toen bedekte de wolk de tent der samenkomst, en de heerlijkheid des Heeren vervulde den tabernakel." },
    ],
  },
  quiz: [
    {
      q: "Wie bouwde de tabernakel, op Gods bevel?",
      choices: ["Mozes en het volk", "Jozua alleen", "Aäron alleen", "Samuël"],
      answer: 0,
      explanation: "Naar al wat Ik u tot een voorbeeld des tabernakels wijzen zal, even alzo zult gijlieden dat maken (Exodus 25:9).",
      level: "easy",
    },
    {
      q: "In welk landschap werd de tabernakel gebouwd?",
      choices: ["Egypte", "De woestijn Sinaï", "Kanaän", "Babel"],
      answer: 1,
      explanation: "De tabernakel werd gebouwd terwijl Israël in de woestijn Sinaï verbleef (Exodus 19:1-2, 25:8).",
      level: "easy",
    },
    {
      q: "Wie waren de twee hoofdambachtslieden van de tabernakel?",
      choices: ["Bezaleël en Aholiab", "Jozua en Kaleb", "Nadab en Abihu", "Eleazar en Ithamar"],
      answer: 0,
      explanation: "God riep Bezaleël en Aholiab, en vervulde hen met den Geest Gods in wijsheid en handwerk (Exodus 31:2-6).",
      level: "easy",
    },
    {
      q: "Van welk hout was de tabernakel voornamelijk gemaakt?",
      choices: ["Cederhout", "Sittimhout", "Olijfhout", "Dennenhout"],
      answer: 1,
      explanation: "Hij maakte ook aan den tabernakel berderen van staand sittimhout (Exodus 36:20).",
      level: "medium",
    },
    {
      q: "Hoeveel lampen waren er op de gouden kandelaar, inclusief de middelste schacht?",
      choices: ["Drie", "Vijf", "Zeven", "Negen"],
      answer: 2,
      explanation: "Zes rieten gingen uit de zijden, plus de middelste schacht, samen zeven lampen (Exodus 25:32, 37).",
      level: "medium",
    },
    {
      q: "Wat scheidde het heilige van het heilige der heiligen?",
      choices: ["Een wand van sittimhout", "Een voorhang van fijn getweernd linnen", "Een scheiding van gouden ketenen", "Een koperen poort"],
      answer: 1,
      explanation: "En deze voorhang zal ulieden een scheiding maken tussen het heilige, en tussen het heilige der heiligen (Exodus 26:33).",
      level: "medium",
    },
    {
      q: "Hoeveel gordijnen vormden het dak van de tabernakel?",
      choices: ["Vier", "Tien", "Twaalf", "Twintig"],
      answer: 1,
      explanation: "Den tabernakel nu zult gij maken van tien gordijnen (Exodus 26:1).",
      level: "medium",
    },
    {
      q: "Wie mocht het heilige der heiligen betreden, en hoe vaak?",
      choices: ["Elke priester, dagelijks", "Alleen de hogepriester, eenmaal per jaar", "Mozes alleen, wekelijks", "Niemand ooit"],
      answer: 1,
      explanation: "Alleen de hogepriester mocht eenmaal per jaar, op den Grote Verzoendag, binnen den voorhang gaan (Lev. 16:2, 34).",
      level: "hard",
    },
    {
      q: "Hoeveel ellen lang en breed was het voorhof?",
      choices: ["Vijftig bij vijfentwintig", "Honderd bij vijftig", "Tweehonderd bij honderd", "Dertig bij vijftien"],
      answer: 1,
      explanation: "De lengte des voorhofs zal honderd ellen zijn, en de breedte doorgaans vijftig (Exodus 27:18).",
      level: "hard",
    },
    {
      q: "Wat volgde de tabernakel om te weten wanneer te reizen of te legeren?",
      choices: ["Een ster", "Een wolk bij dag en vuur bij nacht", "Een bazuin", "Een regenboog"],
      answer: 1,
      explanation: "Want de wolk des Heeren was op den tabernakel bij dag, en een vuur was er des nachts in (Exodus 40:38).",
      level: "hard",
    },
  ],
  timeline: [
    { era: "De Uittocht", year: "Eerste maand, eerste dag", text: "De tabernakel wordt opgericht op den eersten dag der eerste maand van het tweede jaar." },
    { era: "Zwerftocht door de Woestijn", year: "40 jaar", text: "De tabernakel reist met Israël door de woestijn." },
    { era: "Verovering van Kanaän", year: "Dagen van Jozua", text: "De tabernakel wordt opgericht te Silo (Jozua 18:1)." },
    { era: "Tijd der Richteren", year: "Dagen van Eli", text: "De tabernakel blijft te Silo, waar Samuël dient." },
    { era: "Regering van David", year: "Dagen van David", text: "De tabernakel staat te Gibeon (1 Kronieken 16:39), voordat Salomo de Tempel bouwt." },
  ],
  keywords: ["tabernakel", "mozes", "tent der samenkomst", "sittimhout", "ark des verbonds", "bezaleël", "aholiab", "exodus"],
};
