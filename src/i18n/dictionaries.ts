export type Locale = 'es' | 'en';

const es = {
  // Base / meta
  'meta.defaultDescription': '{role}. Proyectos y contacto.',
  'common.skip': 'Saltar al contenido',

  // Navegación
  'nav.home': 'Inicio',
  'nav.about': 'Sobre mí',
  'nav.projects': 'Proyectos',
  'nav.tutorials': 'Tutoriales',
  'nav.contact': 'Contacto',
  'nav.themeLabel': 'Cambiar entre tema claro y oscuro',
  'nav.menuLabel': 'Principal',
  'nav.openMenu': 'Abrir menú',
  'nav.closeMenu': 'Cerrar menú',
  'nav.toEn': 'Cambiar a inglés',
  'nav.toEs': 'Cambiar a español',

  // Portada
  'hero.greeting': 'Hola, soy',
  'hero.viewProjects': 'Ver proyectos',
  'hero.downloadCv': 'Descargar CV',
  'cta.tutorialsTitle': '¿Quieres aprender cómo lo hice?',
  'cta.tutorialsText':
    'En la sección de tutoriales explico paso a paso cómo crear tu propia web personal con Astro, GitHub Pages y un dominio en Cloudflare.',
  'cta.viewTutorials': 'Ver tutoriales',
  'meta.homeTitle': 'Inicio',

  // Sobre mí
  'meta.aboutTitle': 'Sobre mí',
  'meta.aboutDescription': 'Conoce más sobre {name}.',
  'about.title': 'Sobre mí',
  'about.intro':
    'Me dedico al desarrollo y al soporte técnico informático, con el objetivo constante de ampliar mis conocimientos sobre desarrollo de software. Este espacio reúne los proyectos en los que voy trabajando.',
  'about.techTitle': 'Tecnologías',
  'about.cat.languages': 'Lenguajes y desarrollo',
  'about.cat.databases': 'Bases de datos',
  'about.cat.tools': 'Herramientas y metodologías',
  'about.cat.systems': 'Sistemas y redes',
  'about.cat.hardware': 'Hardware y soporte',
  'about.talkText': '¿Hablamos? Escríbeme desde la página de',
  'about.contactPage': 'contacto',
  'about.skill.backups': 'Copias de seguridad',
  'about.skill.diagnostics': 'Diagnóstico',
  'about.skill.repair': 'Reparación',
  'about.skill.support': 'Soporte técnico',

  // Proyectos
  'meta.projectsTitle': 'Proyectos',
  'meta.projectsDescription': 'Proyectos alojados en GitHub.',
  'projects.title': 'Proyectos',
  'projects.lead': 'Mis proyectos públicos en GitHub.',
  'projects.sort': 'Ordenar',
  'projects.sortUpdated': 'Recientes',
  'projects.sortStars': 'Estrellas',
  'projects.sortName': 'Nombre',
  'projects.all': 'Todos',
  'projects.loading': 'Cargando proyectos…',
  'projects.noUser': 'No se ha configurado el usuario de GitHub.',
  'projects.none': 'Todavía no hay proyectos públicos.',
  'projects.noneForLang': 'No hay proyectos en {lang}.',
  'projects.error': 'No se pudieron cargar los proyectos. ',
  'projects.retry': 'Reintentar',
  'projects.stars': '{count} estrellas',
  'projects.forks': '{count} forks',
  'projects.demo': 'Demo',
  'projects.code': 'Código',

  // Contacto
  'meta.contactTitle': 'Contacto',
  'meta.contactDescription': 'Ponte en contacto con {name}.',
  'contact.title': 'Contacto',
  'contact.lead': 'Si quieres hablarme de un proyecto o una oportunidad, escríbeme.',
  'contact.name': 'Nombre',
  'contact.email': 'Tu email',
  'contact.subject': 'Asunto',
  'contact.message': 'Mensaje',
  'contact.send': 'Enviar',
  'contact.error': 'Por favor, rellena todos los campos.',
  'contact.invalidEmail': 'Introduce un email válido (ej: nombre@dominio.com).',

  // Tutoriales
  'meta.tutorialsTitle': 'Tutoriales',
  'meta.tutorialsDescription':
    'Guías y autoaprendizaje de {name}: cómo crear una web personal con Astro, GitHub Pages y Cloudflare.',
  'tutorials.title': 'Tutoriales',
  'tutorials.lead':
    'Me defino como una persona curiosa por naturaleza. Aquí comparto lo que voy aprendiendo, contado desde mi experiencia, para que tú puedas repetirlo.',
  'tutorials.parts': '{count} partes',
  'tutorials.standaloneTitle': 'Experiencias sueltas',
  'tutorials.partOf': 'Parte {n} de {total}',
  'tutorials.prev': '← Anterior',
  'tutorials.next': 'Siguiente →',
  'tutorials.copyCode': 'Copiar',
  'tutorials.copied': '¡Copiado!',
  'tutorials.seriesIndex': 'Índice de la serie',
} as const;

export type TranslationKey = keyof typeof es;

const en: Record<TranslationKey, string> = {
  'meta.defaultDescription': '{role}. Projects and contact.',
  'common.skip': 'Skip to content',

  'nav.home': 'Home',
  'nav.about': 'About',
  'nav.projects': 'Projects',
  'nav.tutorials': 'Tutorials',
  'nav.contact': 'Contact',
  'nav.themeLabel': 'Toggle light and dark theme',
  'nav.menuLabel': 'Main',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.toEn': 'Switch to English',
  'nav.toEs': 'Switch to Spanish',

  'hero.greeting': "Hi, I'm",
  'hero.viewProjects': 'View projects',
  'hero.downloadCv': 'Download CV',
  'cta.tutorialsTitle': 'Want to learn how I built it?',
  'cta.tutorialsText':
    'In the tutorials section I explain step by step how to build your own personal website with Astro, GitHub Pages and a domain on Cloudflare.',
  'cta.viewTutorials': 'View tutorials',
  'meta.homeTitle': 'Home',

  'meta.aboutTitle': 'About',
  'meta.aboutDescription': 'Learn more about {name}.',
  'about.title': 'About me',
  'about.intro':
    'I work in software development and IT support, with the constant goal of expanding my knowledge about software development. This space gathers the projects I keep working on.',
  'about.techTitle': 'Technologies',
  'about.cat.languages': 'Languages & development',
  'about.cat.databases': 'Databases',
  'about.cat.tools': 'Tools & methodologies',
  'about.cat.systems': 'Systems & networks',
  'about.cat.hardware': 'Hardware & support',
  'about.talkText': 'Want to talk? Reach out from the',
  'about.contactPage': 'contact page',
  'about.skill.backups': 'Backups',
  'about.skill.diagnostics': 'Diagnostics',
  'about.skill.repair': 'Repair',
  'about.skill.support': 'Tech support',

  'meta.projectsTitle': 'Projects',
  'meta.projectsDescription': 'Projects hosted on GitHub.',
  'projects.title': 'Projects',
  'projects.lead': 'My public projects on GitHub.',
  'projects.sort': 'Sort',
  'projects.sortUpdated': 'Recent',
  'projects.sortStars': 'Stars',
  'projects.sortName': 'Name',
  'projects.all': 'All',
  'projects.loading': 'Loading projects…',
  'projects.noUser': 'The GitHub user is not configured.',
  'projects.none': 'No public projects yet.',
  'projects.noneForLang': 'No projects in {lang}.',
  'projects.error': "Couldn't load the projects. ",
  'projects.retry': 'Retry',
  'projects.stars': '{count} stars',
  'projects.forks': '{count} forks',
  'projects.demo': 'Demo',
  'projects.code': 'Code',

  'meta.contactTitle': 'Contact',
  'meta.contactDescription': 'Get in touch with {name}.',
  'contact.title': 'Contact',
  'contact.lead': 'If you want to talk about a project or an opportunity, write to me.',
  'contact.name': 'Name',
  'contact.email': 'Your email',
  'contact.subject': 'Subject',
  'contact.message': 'Message',
  'contact.send': 'Send',
  'contact.error': 'Please fill in all the fields.',
  'contact.invalidEmail': 'Please enter a valid email (e.g. name@domain.com).',

  'meta.tutorialsTitle': 'Tutorials',
  'meta.tutorialsDescription':
    'Guides and self-learning from {name}: how to build a personal website with Astro, GitHub Pages and Cloudflare.',
  'tutorials.title': 'Tutorials',
  'tutorials.lead':
    "I define myself as a naturally curious person. Here I share what I keep learning, told from my own experience, so you can repeat it.",
  'tutorials.parts': '{count} parts',
  'tutorials.standaloneTitle': 'Standalone posts',
  'tutorials.partOf': 'Part {n} of {total}',
  'tutorials.prev': '← Previous',
  'tutorials.next': 'Next →',
  'tutorials.copyCode': 'Copy',
  'tutorials.copied': 'Copied!',
  'tutorials.seriesIndex': 'Series index',
};

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = { es, en };
