window.__USERS_SEED__ = {
  "jordan walke": {
    "displayName": "Jordan Walke",
    "password": "crimson",
    "role": "admin",
    "accessLabel": "ADMIN / CRIMSON"
  },
  "jota alpha": {
    "displayName": "Jota Alpha",
    "password": "phoenix",
    "role": "user",
    "accessLabel": "INVESTIGADOR"
  },
  "sadane": {
    "displayName": "Sadane",
    "password": "phoenix",
    "role": "user",
    "accessLabel": "INVESTIGADOR"
  },
  "bernard": {
    "displayName": "Bernard",
    "password": "phoenix",
    "role": "user",
    "accessLabel": "INVESTIGADOR"
  }
};
window.__EVIDENCE_SEED__ = [
  {
    "id": "ev-phoenix-intro",
    "command": "phoenix-intro",
    "aliases": [
      "intro",
      "bienvenida",
      "red-phoenix"
    ],
    "title": "Red Phoenix // Introduccion operativa",
    "type": "text",
    "content": "Bienvenido a la Red Phoenix. La red fue creada para coordinar la investigacion de anomalias detectadas en regiones habitadas y no habitadas. Los eventos registrados no coinciden con tecnologia humana, Guardian ni Thargoide. Toda la informacion sera distribuida por esta terminal. Nivel de prioridad: CRIMSON.",
    "summary": "Entrada global inicial del proyecto.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/intro-red-phoenix.png"
  },
  {
    "id": "ev-dossier-jota",
    "command": "dossier-jota",
    "aliases": [
      "jota-dossier",
      "cmdr-jota"
    ],
    "title": "Dossier personal // CMDR Jota Alpha",
    "type": "text",
    "content": "Investigador principal del incidente original. Detecto una senal anomala en una region remota. Los datos no pudieron ser clasificados por sistemas estandar. Se identificaron patrones que apuntan a multiples ubicaciones. Objetivo: localizar la siguiente pista.",
    "summary": "Dossier asignado unicamente a Jota Alpha.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "specific",
    "commanders": [
      "jota alpha"
    ],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/dossier-jota-alpha.png"
  },
  {
    "id": "ev-dossier-sadane",
    "command": "dossier-sadane",
    "aliases": [
      "sadane-dossier",
      "cmdr-sadane"
    ],
    "title": "Dossier personal // CMDR Sadane",
    "type": "text",
    "content": "Veterano de combate y exploracion. Fue contactado por AFEC por su experiencia en entornos hostiles. No posee informacion completa del descubrimiento original. Objetivo: determinar si la anomalia representa una amenaza potencial.",
    "summary": "Dossier asignado unicamente a Sadane.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "specific",
    "commanders": [
      "sadane"
    ],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/dossier-sadane.png"
  },
  {
    "id": "ev-dossier-bernard",
    "command": "dossier-bernard",
    "aliases": [
      "bernard-dossier",
      "cmdr-bernard"
    ],
    "title": "Dossier personal // CMDR Bernard",
    "type": "text",
    "content": "Miembro asociado al Indice Moebius. Participa en catalogacion cientifica y recuperacion historica. Moebius firmo cooperacion con AFEC y Aornum Crimson Universal Ltd. Objetivo: validar cientificamente la informacion obtenida.",
    "summary": "Dossier asignado unicamente a Bernard.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "specific",
    "commanders": [
      "bernard"
    ],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/dossier-bernard.png"
  },
  {
    "id": "ev-archivo-a01",
    "command": "archivo-a01",
    "aliases": [
      "a01-archivo",
      "phx-a01-doc"
    ],
    "title": "Archivo A-01",
    "type": "text",
    "content": "El hallazgo excede las capacidades de un unico investigador. Las evidencias sugieren una red de localizaciones conectadas por principios desconocidos. Se recomienda una estructura permanente de investigacion. Nivel de prioridad: CRIMSON. Financiacion aprobada. Proyecto PHOENIX autorizado.",
    "summary": "Documento global marcado como desbloqueable.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/archivo-a01.png"
  },
  {
    "id": "ev-jota-01",
    "command": "jota-01",
    "aliases": [
      "bitacora-jota",
      "jota"
    ],
    "title": "Bitacora de Jota Alpha // Registro privado",
    "type": "text",
    "content": "La senal no parece Guardian. No responde a patron humano conocido. El objeto contiene estructuras repetitivas que parecen formar una secuencia. No se determina aun si es lenguaje, mapa o advertencia.",
    "summary": "Bitacora global desbloqueable.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/research-lab-terminal.png"
  },
  {
    "id": "ev-libertas-01",
    "command": "libertas-01",
    "aliases": [
      "transmision-libertas",
      "libertas"
    ],
    "title": "Transmision recibida // Libertas Progressus",
    "type": "text",
    "content": "CANAL LIBERTAS PROGRESSUS // MENSAJE PRIORITARIO. La activacion parcial del artefacto A-01 parece responder a variaciones gravitacionales minimas y una secuencia de coordenadas aun incompleta. Solicitamos sincronizacion con AFEC y confirmacion de parametros orbitales antes de la siguiente ventana de analisis.",
    "summary": "Transmision urgente desde Libertas Progressus con requerimiento de sincronizacion orbital.",
    "source": "Dr. Marcus Haldane // Libertas Progressus",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "from": "Dr. Marcus Haldane",
    "media": "assets/evidence/transmision-libertas-01.png",
    "channel": "communications",
    "kind": "communication"
  },
  {
    "id": "ev-libertas-anexo",
    "command": "libertas-anexo",
    "aliases": [
      "anexo-libertas",
      "vector-17"
    ],
    "title": "Anexo tecnico // Libertas",
    "type": "text",
    "content": "Fragmentos visibles: VECTOR 17 / AZIMUT 223.8 / REFERENCIA 359 / DESPLAZAMIENTO 14. Los datos parecen incompletos y varias cifras fueron eliminadas del informe original.",
    "summary": "Anexo global desbloqueable.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/fragmento-holograma-a01-v2.png"
  },
  {
    "id": "ev-vesper-01",
    "command": "vesper-01",
    "aliases": [
      "vesper-mensaje-1"
    ],
    "title": "Canal seguro // Vesper 01",
    "type": "text",
    "content": "He seguido sus actividades. No son los unicos que buscan respuestas. Existen registros fuera de bases publicas y sistemas deliberadamente olvidados. Si continuan investigando encontraran algo mas antiguo que cualquier estructura Guardian.",
    "summary": "Mensaje global desbloqueable.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/vesper-message-01.png"
  },
  {
    "id": "ev-vesper-02",
    "command": "vesper-02",
    "aliases": [
      "vesper-mensaje-2"
    ],
    "title": "Canal seguro // Vesper 02",
    "type": "text",
    "content": "Las coordenadas no representan un destino, representan una secuencia. Cada ubicacion es una pieza de algo mayor. Alguien intento ocultar el conjunto completo y alguien sigue intentandolo.",
    "summary": "Mensaje global desbloqueable.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/vesper-message-02.png"
  },
  {
    "id": "ev-nodo-phx-01",
    "command": "nodo-phx-01",
    "aliases": [
      "phx01-nodo"
    ],
    "title": "Informe // Nodo PHX-01",
    "type": "text",
    "content": "Estado: confirmado. Se verificaron anomalias energeticas no catalogadas. Resultado: descartado el error instrumental.",
    "summary": "Informe global desbloqueable.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/intro-red-phoenix.png"
  },
  {
    "id": "ev-nodo-phx-02",
    "command": "nodo-phx-02",
    "aliases": [
      "phx02-nodo"
    ],
    "title": "Informe // Nodo PHX-02",
    "type": "text",
    "content": "Estado: confirmado. Las estructuras observadas presentan proporciones matematicas recurrentes. No coinciden con arquitectura humana ni Guardian.",
    "summary": "Informe global desbloqueable.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/artifact-hologram-a01.png"
  },
  {
    "id": "ev-nodo-phx-03",
    "command": "nodo-phx-03",
    "aliases": [
      "phx03-nodo"
    ],
    "title": "Informe // Nodo PHX-03",
    "type": "text",
    "content": "Estado: parcial. Se detecto evidencia de actividad previa sin restos de ocupacion reciente. El lugar parece abandonado desde un periodo imposible de determinar.",
    "summary": "Informe global desbloqueable.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/dossier-aornum-a01.png"
  },
  {
    "id": "ev-dg-jordan",
    "command": "director-jordan",
    "aliases": [
      "verdad-phoenix",
      "oculto-jordan"
    ],
    "title": "Informacion del director de juego",
    "type": "text",
    "content": "Verdad parcial: el artefacto no es un mapa, es una llave. Las coordenadas son puntos de sincronizacion. La red fue construida por una civilizacion anterior a los Guardianes. AFEC cree investigar arqueologia, pero en realidad activa una infraestructura antigua.",
    "summary": "Bloque oculto reservado al director de juego.",
    "source": "Proyecto Phoenix.pdf",
    "active": true,
    "access": "admin",
    "audienceMode": "specific",
    "commanders": [
      "jordan walke"
    ],
    "hidden": true,
    "unlockedForAll": false,
    "unlockedFor": [],
    "media": "assets/evidence/director-jordan-walke.png"
  },
  {
    "id": "ev-a01-hologram",
    "command": "phx-visual-a01",
    "aliases": [
      "phx-01",
      "a01-holograma",
      "fragmento-a01",
      "a-01"
    ],
    "title": "Fragmento A-01 // Proyeccion holografica",
    "type": "image",
    "content": "assets/evidence/artifact-hologram-a01.png",
    "summary": "Vista principal del artefacto con malla de nodos y referencias A-01, C-07 y K-11.",
    "source": "Prop adjunto 03:18",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-dossier-aornum-a01",
    "command": "dossier-a01",
    "aliases": [
      "archivo-aornum-visual",
      "informe-a01"
    ],
    "title": "Archivo Aornum - Fragmento A-01",
    "type": "image",
    "content": "assets/evidence/archivo-a01.png",
    "summary": "Lamina tecnica con analisis de composicion, grabados y secciones de lectura de campo.",
    "source": "Prop adjunto 03:45",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-phoenix-crimson",
    "command": "crimson",
    "aliases": [
      "proyecto-phoenix",
      "prioridad-crimson"
    ],
    "title": "Proyecto Phoenix // Evaluacion Crimson",
    "type": "image",
    "content": "assets/evidence/project-phoenix-crimson-v2.png",
    "summary": "Documento estrategico de autorizacion, riesgos y potencial corporativo.",
    "source": "Prop adjunto 04:14",
    "active": true,
    "access": "admin",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-stitch-login",
    "command": "stitch-login",
    "aliases": [
      "acceso-corporativo"
    ],
    "title": "Stitch // Acceso corporativo Aornum",
    "type": "image",
    "content": "assets/evidence/stitch-login-screen.png",
    "summary": "Pantalla base de acceso tomada del proyecto Stitch compartido.",
    "source": "ZIP Stitch",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-stitch-terminal",
    "command": "stitch-terminal",
    "aliases": [
      "terminal-phoenix"
    ],
    "title": "Stitch // Terminal de investigacion Phoenix",
    "type": "image",
    "content": "assets/evidence/stitch-terminal-screen.png",
    "summary": "Vista general del layout operativo de consola y navegacion.",
    "source": "ZIP Stitch",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-stitch-repo",
    "command": "stitch-repo",
    "aliases": [
      "repositorio-evidencias"
    ],
    "title": "Stitch // Repositorio de evidencias clasificadas",
    "type": "image",
    "content": "assets/evidence/stitch-evidence-repo-screen.png",
    "summary": "Repositorio visual de elementos clasificados en estilo HUD.",
    "source": "ZIP Stitch",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-stitch-perfil",
    "command": "stitch-perfil",
    "aliases": [
      "perfil-investigador"
    ],
    "title": "Stitch // Perfil de investigador",
    "type": "image",
    "content": "assets/evidence/stitch-profile-screen.png",
    "summary": "Pantalla de perfil operativo con estado y trazas de usuario.",
    "source": "ZIP Stitch",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-stitch-admin",
    "command": "stitch-admin",
    "aliases": [
      "consola-admin-central"
    ],
    "title": "Stitch // Consola de administracion central",
    "type": "image",
    "content": "assets/evidence/stitch-admin-console-screen.png",
    "summary": "Pantalla de gestion central de nodos y estado operativo.",
    "source": "ZIP Stitch",
    "active": true,
    "access": "admin",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-informe-crimson-sec",
    "command": "informe-crimson",
    "aliases": [
      "acu-intel-crimson",
      "phoenix-evaluacion"
    ],
    "title": "Informe corporativo // Proyecto Phoenix (Crimson)",
    "type": "image",
    "content": "assets/evidence/proyecto-phoenix-informe-crimson.png",
    "summary": "Informe corporativo complementario con riesgos y matriz de impacto.",
    "source": "Aornum Crimson Universal Ltd.",
    "active": true,
    "access": "admin",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": false,
    "unlockedFor": []
  },
  {
    "id": "ev-haldane-transmision-01",
    "command": "haldane-01",
    "aliases": [
      "dr-haldane",
      "transmision-haldane",
      "haldane-video"
    ],
    "title": "Transmision Dr. Haldane // Registro 01",
    "type": "text",
    "content": "CANAL LIBERTAS PROGRESSUS // Dr. Haldane reporta oscilaciones no lineales en el Fragmento A-01 y solicita correlacion con los nuevos registros visuales del artefacto.",
    "summary": "Primera transmision en video del Dr. Haldane para pruebas de reproduccion.",
    "source": "Dr. Marcus Haldane // Libertas Progressus",
    "from": "Dr. Marcus Haldane",
    "media": "assets/evidence/transmision-dr-haldane-01.mp4",
    "mediaType": "video/mp4",
    "mediaName": "transmision-dr-haldane-01.mp4",
    "channel": "communications",
    "kind": "communication",
    "createdAt": "2026-06-01T18:08:09.041Z",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": true,
    "unlockedFor": []
  },
  {
    "id": "ev-artifact-video-macro-01",
    "command": "artifacto-video-01",
    "aliases": [
      "a01-video-01",
      "artifact-video-01",
      "macro-a01"
    ],
    "title": "Fragmento A-01 // Video Macro 01",
    "type": "video",
    "content": "assets/evidence/artifact-video-a01-macro.mp4",
    "summary": "Toma macro del artefacto A-01 para analisis visual.",
    "source": "ElevenLabs / Kling 2.5",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": true,
    "unlockedFor": []
  },
  {
    "id": "ev-artifact-video-closeup-02",
    "command": "artifacto-video-02",
    "aliases": [
      "a01-video-02",
      "artifact-video-02",
      "closeup-a01"
    ],
    "title": "Fragmento A-01 // Video Close-up 02",
    "type": "video",
    "content": "assets/evidence/artifact-video-a01-closeup.mp4",
    "summary": "Toma close-up del artefacto A-01 para pruebas de reproduccion.",
    "source": "ElevenLabs / Kling 2.5",
    "active": true,
    "access": "user",
    "audienceMode": "all",
    "commanders": [],
    "hidden": false,
    "unlockedForAll": true,
    "unlockedFor": []
  }
];
