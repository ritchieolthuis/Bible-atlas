import type { Locale } from "./locale";

export interface UiStrings {
  brand: {
    name: string;
    tagline: string;
  };
  banner: {
    lead: string;
    bibleName: string;
    note: string;
    verse: string;
    dismiss: string;
  };
  nav: {
    explore: string;
    structures: string;
    scripture: string;
    library: string;
    timeline: string;
    gospel: string;
  };
  header: {
    openMenu: string;
    searchPlaceholder: string;
    searchAria: string;
  };
  library: {
    kicker: string;
    viewAll: string;
    illustrationAlt: (dwelling: string) => string;
    markFavorite: string;
    removeFavorite: string;
  };
  info: {
    selectedStructure: string;
    moreOptions: string;
    illustrationAlt: (dwelling: string) => string;
    keyFacts: string;
    readScripture: string;
    animate: string;
    stop: string;
    sacredObjects: string;
    quiz: string;
  };
  viewer: {
    autoRotate: string;
    toolsAria: string;
    rotate: string;
    pan: string;
    zoomIn: string;
    zoomOut: string;
    fullscreen: string;
    exitFullscreen: string;
    layers: string;
    layerLabels: string;
    layerGrid: string;
    layerWire: string;
    layerXray: string;
    artifacts: string;
    timeline: string;
    reset: string;
    closeDetail: string;
    tip: string;
    tipDismiss: string;
    tipText: string;
    disclaimer: string;
    loadingPrefix: string;
    loadingFact: string;
    loadTooHeavy: (name: string) => string;
    canvasAria: (dwelling: string) => string;
    stageAria: (dwelling: string) => string;
    clickToExplore: string;
    markersAria: string;
  };
  modals: {
    lessonKicker: (name: string) => string;
    lessonCta: string;
    quizComplete: string;
    quizQuestionOf: (step: number, total: number) => string;
    quizKicker: (dwelling: string) => string;
    seeResults: string;
    nextQuestion: string;
    scorePerfect: string;
    scoreGood: string;
    scoreLow: string;
    retakeQuiz: string;
    levelEasy: string;
    levelMedium: string;
    levelHard: string;
    chooseLevel: string;
    changeLevel: string;
    timelineTitle: (name: string) => string;
    timelineKicker: string;
    timelineHint: string;
    close: string;
    gospel: {
      kicker: string;
      title: string;
      subtitle: string;
      intro: string;
      steps: { heading: string; body: string; verses: { text: string; ref: string }[] }[];
      prayerKicker: string;
      prayerIntro: string;
      prayerText: string;
      afterword: string;
    };
  };
  search: {
    placeholder: string;
    aria: string;
    noResults: string;
    kind: {
      structure: string;
      location: string;
      feature: string;
      room: string;
      artifact: string;
      material: string;
    };
    locationOf: (name: string) => string;
    layoutOf: (dwelling: string) => string;
    relatedTo: (name: string) => string;
  };
  menu: {
    title: string;
    close: string;
    label: string;
  };
  languageSwitcher: {
    label: string;
    en: string;
    nl: string;
  };
  hotspotCategory: {
    structure: string;
    roof: string;
    court: string;
    entrance: string;
    interior: string;
    "artifact-zone": string;
    facade: string;
  };
  docTitleSuffix: string;
  footer: {
    copyright: string;
    partOf: string;
    forum: string;
    donate: string;
  };
}

export const STRINGS: Record<Locale, UiStrings> = {
  en: {
    brand: {
      name: "The 3D Bible",
      tagline: "Explore the Structures of Scripture",
    },
    banner: {
      lead: "Every structure in The 3D Bible is accurately modeled after the",
      bibleName: "King James Bible",
      note: "This visualization may differ in rendering details; Scripture remains the authoritative guide at all times.",
      verse: "\"Thy word is truth.\"  -  John 17:17 (KJV)",
      dismiss: "Dismiss credits",
    },
    nav: {
      explore: "Explore",
      structures: "Structures",
      scripture: "Scripture",
      library: "Library",
      timeline: "Timeline",
      gospel: "Gospel",
    },
    header: {
      openMenu: "Open menu",
      searchPlaceholder: "Search structures, temples…",
      searchAria: "Search structures, temples, features",
    },
    library: {
      kicker: "Bible Library",
      viewAll: "View all structures",
      illustrationAlt: (dwelling) => `${dwelling} illustration`,
      markFavorite: "Mark favorite",
      removeFavorite: "Remove favorite",
    },
    info: {
      selectedStructure: "Selected Structure",
      moreOptions: "More options",
      illustrationAlt: (dwelling) => `Illustration of the ${dwelling}`,
      keyFacts: "Key Facts",
      readScripture: "Read Scripture",
      animate: "Animate",
      stop: "Stop",
      sacredObjects: "Artifacts",
      quiz: "Quiz",
    },
    viewer: {
      autoRotate: "Auto rotate",
      toolsAria: "Model tools",
      rotate: "Rotate",
      pan: "Pan",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit fullscreen",
      layers: "Layers",
      layerLabels: "Hotspot pins",
      layerGrid: "Turntable grid",
      layerWire: "Wireframe",
      layerXray: "X-ray section",
      artifacts: "Artifacts",
      timeline: "Timeline",
      reset: "Reset",
      closeDetail: "Close detail",
      tip: "Tip",
      tipDismiss: "Dismiss tip",
      tipText: "Drag to rotate. Scroll to zoom. Hover a pin on the structure to read about it.",
      disclaimer: "Note: This 3D model may vary due to rendering and visualization; the biblical Scriptures take precedence.",
      loadingPrefix: "Loading",
      loadingFact: "Preparing the temple courts…",
      loadTooHeavy: (name) => `The ${name} model is too large for this device's memory. Try again on a desktop computer or a device with more memory.`,
      canvasAria: (dwelling) => `3D model of the ${dwelling}`,
      stageAria: (dwelling) => `Interactive 3D viewer. Use arrow keys to rotate the ${dwelling} model, plus and minus to zoom.`,
      clickToExplore: "Click to explore",
      markersAria: "Architectural markers",
    },
    modals: {
      lessonKicker: (name) => `Scripture · ${name}`,
      lessonCta: "Test your knowledge, take the quiz",
      quizComplete: "Quiz complete",
      quizQuestionOf: (step, total) => `Question ${step} of ${total}`,
      quizKicker: (dwelling) => `Quiz · ${dwelling}`,
      seeResults: "See results",
      nextQuestion: "Next question",
      scorePerfect: "A scholar's knowledge of this structure.",
      scoreGood: "Well explored, a few corners left to discover.",
      scoreLow: "This structure still holds its secrets, revisit the lesson.",
      retakeQuiz: "Retake quiz",
      levelEasy: "Easy",
      levelMedium: "Medium",
      levelHard: "Hard",
      chooseLevel: "Choose a difficulty",
      changeLevel: "Change difficulty",
      timelineTitle: (name) => `${name}, Timeline`,
      timelineKicker: "Historical context",
      timelineHint: "Drag the slider or pick an era to trace the biblical history of this structure.",
      close: "Close",
      gospel: {
        kicker: "Romans Road",
        title: "What Is the Gospel?",
        subtitle: "And how it changes your life",
        intro: "The word gospel simply means good news. It is the story of God's love for you, and it shows how you can be brought into right relationship with Him. This good news comes in three clear steps, laid out directly in Scripture.",
        steps: [
          {
            heading: "The Honest Truth",
            body: "Everyone wants to live a good life, but when we look honestly at ourselves, we find that we all fall short, in love, in patience, in honesty. Scripture states this plainly, in the book of Romans. Because of this sin, a gap has opened between us and God, cutting us off from His perfect holiness and glory.",
            verses: [
              { text: "There is none righteous, no, not one:", ref: "Romans 3:10" },
              { text: "For all have sinned, and come short of the glory of God;", ref: "Romans 3:23" },
            ],
          },
          {
            heading: "The Free Gift",
            body: "We cannot close that gap ourselves, by trying harder or keeping religious rules. Thankfully, we do not have to: God has already done it for us. The wages of sin is spiritual death, separation from God, but God offers grace, a free gift, not earned by works. Jesus Christ came to earth, died on the cross to carry our sin, and rose again from the dead. He has already built the bridge across the gap.",
            verses: [
              { text: "Therefore we conclude that a man is justified by faith without the deeds of the law.", ref: "Romans 3:28" },
              { text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.", ref: "Romans 6:23" },
            ],
          },
          {
            heading: "How Do You Come to Faith?",
            body: "How does this gift become yours? Not by achieving it, but by simply receiving it, opening your heart and speaking to God. Coming to faith is as simple as this: believing in your heart that Jesus was raised from the dead for you, and confessing that from now on you will live for Him. Everyone who calls on His name receives a clean slate and a new, eternal life.",
            verses: [
              { text: "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.", ref: "Romans 10:9" },
              { text: "For whosoever shall call upon the name of the Lord shall be saved.", ref: "Romans 10:13" },
            ],
          },
        ],
        prayerKicker: "Your First Step",
        prayerIntro: "Do you want to receive this gift and come to faith today? You may speak this prayer to God now, aloud or in your heart:",
        prayerText: "Father in heaven, Jesus Christ, I call out to You. I know I am a sinner, and I know I deserve judgment. But I believe You died on the cross for me, and rose again from the dead. Jesus Christ, save me now, and give me eternal life. From today, I trust in You alone. Amen.",
        afterword: "If you meant this, God has heard you. From this moment you are saved, and may begin to discover what it means to walk with Him, every day.",
      },
    },
    search: {
      placeholder: "Search structures, temples, rooms, objects…",
      aria: "Search",
      noResults: "No matching entries in The 3D Bible.",
      kind: {
        structure: "structure",
        location: "location",
        feature: "feature",
        room: "room",
        artifact: "artifact",
        material: "material",
      },
      locationOf: (name) => `Location of ${name}`,
      layoutOf: (dwelling) => `${dwelling} layout`,
      relatedTo: (name) => `Related to ${name}`,
    },
    menu: {
      title: "The 3D Bible",
      close: "Close menu",
      label: "Menu",
    },
    languageSwitcher: {
      label: "Language",
      en: "English",
      nl: "Nederlands",
    },
    hotspotCategory: {
      structure: "structure",
      roof: "roof",
      court: "court",
      entrance: "entrance",
      interior: "interior",
      "artifact-zone": "artifact zone",
      facade: "facade",
    },
    docTitleSuffix: "The 3D Bible: History and Architecture",
    footer: {
      copyright: "© 2026 The 3D Bible",
      partOf: "The 3D Bible is part of De Samenkomst. Developed by Ritchie Olthuis.",
      forum: "Forum",
      donate: "Donate",
    },
  },
  nl: {
    brand: {
      name: "The 3D Bible",
      tagline: "Ontdek de Bouwwerken van de Schrift",
    },
    banner: {
      lead: "Elk bouwwerk in The 3D Bible is nauwkeurig gemodelleerd naar de",
      bibleName: "Statenvertaling",
      note: "Deze visualisatie kan door rendering in details afwijken; de Bijbelse geschriften blijven te allen tijde de leidraad.",
      verse: "\"Uw woord is de waarheid.\"  -  Johannes 17:17",
      dismiss: "Melding sluiten",
    },
    nav: {
      explore: "Verkennen",
      structures: "Bouwwerken",
      scripture: "Schrift",
      library: "Bibliotheek",
      timeline: "Tijdlijn",
      gospel: "Evangelie",
    },
    header: {
      openMenu: "Menu openen",
      searchPlaceholder: "Zoek bouwwerken, tempels…",
      searchAria: "Zoek bouwwerken, tempels, kenmerken",
    },
    library: {
      kicker: "Bijbelbibliotheek",
      viewAll: "Alle bouwwerken bekijken",
      illustrationAlt: (dwelling) => `Illustratie van ${dwelling}`,
      markFavorite: "Markeren als favoriet",
      removeFavorite: "Favoriet verwijderen",
    },
    info: {
      selectedStructure: "Geselecteerd bouwwerk",
      moreOptions: "Meer opties",
      illustrationAlt: (dwelling) => `Illustratie van ${dwelling}`,
      keyFacts: "Kerngegevens",
      readScripture: "Lees de Schrift",
      animate: "Animeren",
      stop: "Stoppen",
      sacredObjects: "Artefacten",
      quiz: "Quiz",
    },
    viewer: {
      autoRotate: "Auto rotate",
      toolsAria: "Modelgereedschap",
      rotate: "Draaien",
      pan: "Verschuiven",
      zoomIn: "Inzoomen",
      zoomOut: "Uitzoomen",
      fullscreen: "Volledig scherm",
      exitFullscreen: "Volledig scherm sluiten",
      layers: "Lagen",
      layerLabels: "Hotspot-pins",
      layerGrid: "Draaitafelraster",
      layerWire: "Draadframe",
      layerXray: "Doorsnede",
      artifacts: "Voorwerpen",
      timeline: "Tijdlijn",
      reset: "Reset",
      closeDetail: "Detail sluiten",
      tip: "Tip",
      tipDismiss: "Tip sluiten",
      tipText: "Sleep om te draaien. Scroll om te zoomen. Hover over een pin op het bouwwerk om erover te lezen.",
      disclaimer: "Let op: Dit 3D-model kan door rendering en visualisatie afwijken; de Bijbelse geschriften zijn leidend.",
      loadingPrefix: "Bezig met laden van",
      loadingFact: "De voorhoven van de tempel worden voorbereid…",
      loadTooHeavy: (name) => `Het model van ${name} is te zwaar voor het geheugen van dit toestel. Probeer het op een computer of een toestel met meer geheugen.`,
      canvasAria: (dwelling) => `3D-model van ${dwelling}`,
      stageAria: (dwelling) => `Interactieve 3D-viewer. Gebruik de pijltjestoetsen om ${dwelling} te draaien, plus en min om te zoomen.`,
      clickToExplore: "Klik om te verkennen",
      markersAria: "Architectonische markeringen",
    },
    modals: {
      lessonKicker: (name) => `Schrift · ${name}`,
      lessonCta: "Test je kennis, doe de quiz",
      quizComplete: "Quiz voltooid",
      quizQuestionOf: (step, total) => `Vraag ${step} van ${total}`,
      quizKicker: (dwelling) => `Quiz · ${dwelling}`,
      seeResults: "Bekijk resultaten",
      nextQuestion: "Volgende vraag",
      scorePerfect: "De kennis van een geleerde over dit bouwwerk.",
      scoreGood: "Goed verkend, nog een paar hoeken te ontdekken.",
      scoreLow: "Dit bouwwerk houdt zijn geheimen nog vast, bekijk de les nog eens.",
      retakeQuiz: "Quiz opnieuw doen",
      levelEasy: "Makkelijk",
      levelMedium: "Gemiddeld",
      levelHard: "Moeilijk",
      chooseLevel: "Kies een niveau",
      changeLevel: "Niveau wijzigen",
      timelineTitle: (name) => `${name}, Tijdlijn`,
      timelineKicker: "Historische context",
      timelineHint: "Sleep de schuifregelaar of kies een tijdperk om de bijbelse geschiedenis van dit bouwwerk te volgen.",
      close: "Sluiten",
      gospel: {
        kicker: "Romeinenweg",
        title: "Wat Is het Evangelie?",
        subtitle: "En hoe het je leven verandert",
        intro: "Het woord evangelie betekent letterlijk goed nieuws. Het is het verhaal van Gods liefde voor jou, en het vertelt hoe je (weer) in de juiste relatie met Hem kunt komen. Dit goede nieuws bestaat uit drie duidelijke stappen, die rechtstreeks in de Bijbel staan.",
        steps: [
          {
            heading: "De Eerlijke Realiteit",
            body: "Iedereen wil graag goed leven, maar als we heel eerlijk naar onszelf kijken, merken we dat we allemaal fouten maken. We schieten tekort in liefde, geduld en eerlijkheid. In de Bijbel, in het boek Romeinen, staat dat heel direct beschreven. Door die fouten, de zonde, is er een kloof ontstaan tussen ons en God. We missen daardoor de verbinding met Zijn volmaakte rust en glans.",
            verses: [
              { text: "Niemand is rechtvaardig, ook niet één,", ref: "Romeinen 3:10" },
              { text: "Want allen hebben gezondigd en derven de heerlijkheid Gods", ref: "Romeinen 3:23" },
            ],
          },
          {
            heading: "Het Gratis Geschenk",
            body: "Die kloof kunnen we niet zelf overbruggen door simpelweg beter ons best te doen of religieuze regeltjes te volgen. Gelukkig hoeft dat ook niet, want God lost het voor ons op. Het gevolg van de zonde is de spirituele dood, verwijdering van God, maar God geeft ons genade: een gratis cadeau waar je niet voor hoeft te werken. Jezus Christus kwam naar de aarde, stierf aan het kruis om onze fouten te dragen, en stond weer op uit de dood. Hij heeft de brug over de kloof al gebouwd.",
            verses: [
              { text: "Want wij zijn van oordeel, dat de mens door geloof gerechtvaardigd wordt, zonder werken der wet.", ref: "Romeinen 3:28" },
              { text: "Want het loon, dat de zonde geeft, is de dood, maar de genade, die God schenkt, is het eeuwige leven in Christus Jezus, onze Here.", ref: "Romeinen 6:23" },
            ],
          },
          {
            heading: "Hoe Kom Je tot Geloof?",
            body: "Hoe wordt dit cadeau van jou? Niet door te presteren, maar door het simpelweg aan te nemen. Dat doe je door je hart open te stellen en met God te praten. Tot geloof komen is dus zo simpel als: geloven in je hart dat Jezus voor jou is opgestaan, en uitspreken, belijden, dat je vanaf nu met Hem wilt leven. Iedereen die Hem aanroept om hulp, krijgt een schone lei en een nieuw, eeuwig leven.",
            verses: [
              { text: "Want indien gij met uw mond belijdt, dat Jezus Heer is, en met uw hart gelooft, dat God Hem uit de doden heeft opgewekt, zult gij behouden worden;", ref: "Romeinen 10:9" },
              { text: "want: al wie de naam des Heren aanroept, zal behouden worden.", ref: "Romeinen 10:13" },
            ],
          },
        ],
        prayerKicker: "Jouw Eerste Stap",
        prayerIntro: "Wil jij dit cadeau aannemen en vandaag nog tot geloof komen? Je mag dit gebed nu rechtstreeks hardop of in gedachten tegen God uitspreken:",
        prayerText: "Vader in de hemel, Jezus Christus, ik roep tot U. Ik weet ik ben een zondaar en ik weet dat ik de hel verdien. Maar ik geloof dat U bent doodgegaan aan het kruis voor mij, en weer bent opgestaan uit de dood. Jezus Christus, red mij nu, en geef mij het eeuwige leven. Vanaf vandaag, vertrouw ik alleen op U. Amen.",
        afterword: "Als je dit meent, heeft God je gehoord. Je bent vanaf dit moment gered, behouden, en mag gaan ontdekken hoe het is om elke dag samen met Hem te wandelen!",
      },
    },
    search: {
      placeholder: "Zoek bouwwerken, tempels, ruimtes, voorwerpen…",
      aria: "Zoeken",
      noResults: "Geen overeenkomende resultaten in The 3D Bible.",
      kind: {
        structure: "bouwwerk",
        location: "locatie",
        feature: "kenmerk",
        room: "ruimte",
        artifact: "voorwerp",
        material: "materiaal",
      },
      locationOf: (name) => `Locatie van ${name}`,
      layoutOf: (dwelling) => `Plattegrond van ${dwelling}`,
      relatedTo: (name) => `Gerelateerd aan ${name}`,
    },
    menu: {
      title: "The 3D Bible",
      close: "Menu sluiten",
      label: "Menu",
    },
    languageSwitcher: {
      label: "Taal",
      en: "English",
      nl: "Nederlands",
    },
    hotspotCategory: {
      structure: "bouwwerk",
      roof: "dak",
      court: "voorhof",
      entrance: "ingang",
      interior: "interieur",
      "artifact-zone": "voorwerpenzone",
      facade: "gevel",
    },
    docTitleSuffix: "The 3D Bible: History and Architecture",
    footer: {
      copyright: "© 2026 The 3D Bible",
      partOf: "De 3D-Bijbel is onderdeel van De Samenkomst. Ontwikkeld door Ritchie Olthuis.",
      forum: "Forum",
      donate: "Doneren",
    },
  },
};

export function useStrings(locale: Locale): UiStrings {
  return STRINGS[locale];
}
