import type { Locale } from "./locale";

export interface UiStrings {
  brand: {
    name: string;
    tagline: string;
  };
  banner: {
    lead: string;
    bibleName: string;
    verse: string;
    dismiss: string;
  };
  nav: {
    explore: string;
    structures: string;
    scripture: string;
    library: string;
    timeline: string;
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
      lead: "Every structure in this atlas is described in the",
      bibleName: "King James Bible",
      verse: "All Scripture is given by inspiration of God, 2 Timothy 3:16 (KJV)",
      dismiss: "Dismiss credits",
    },
    nav: {
      explore: "Explore",
      structures: "Structures",
      scripture: "Scripture",
      library: "Library",
      timeline: "Timeline",
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
      lead: "Elk bouwwerk in deze atlas wordt beschreven volgens de",
      bibleName: "Statenvertaling",
      verse: "Al de Schrift is van God ingegeven  -  2 Timotheüs 3:16 (SV)",
      dismiss: "Melding sluiten",
    },
    nav: {
      explore: "Verkennen",
      structures: "Bouwwerken",
      scripture: "Schrift",
      library: "Bibliotheek",
      timeline: "Tijdlijn",
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
