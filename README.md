# VecinIA - Asistente Empático con IA

VecinIA es un asistente con Inteligencia Artificial diseñado para ayudar a las personas mayores a gestionar sus recordatorios y citas diarias de una manera sencilla e intuitiva.

## ✨ Utilidad del Proyecto

El objetivo principal de VecinIA es ofrecer una herramienta tecnológica amigable que combata la soledad y facilite la organización de la vida diaria de los mayores, permitiéndoles mantener su independencia y calidad de vida.

## 🚀 Características Principales

- **Gestión de Recordatorios**: Permite a los usuarios crear, ver y eliminar recordatorios para citas médicas, eventos sociales o cualquier otra tarea.
- **Interfaz Sencilla**: Diseñada pensando en la accesibilidad y facilidad de uso para personas con poca experiencia tecnológica.
- **Asistente IA**: Integra la potencia de OpenAI para ofrecer una interacción más natural y empática (funcionalidad subyacente).
- **Autenticación Segura**: Sistema de registro e inicio de sesión para proteger la información de cada usuario.

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: SQLite
- **Autenticación**: bcrypt
- **Inteligencia Artificial**: OpenAI API
- **Frontend**: HTML, CSS, JavaScript

## ⚙️ Guía de Instalación y Despliegue Local

Sigue estos pasos para descargar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (que incluye npm) en tu sistema.

### Pasos

1.  **Clona el repositorio**:
    ```bash
    git clone https://github.com/bellrauthien/vecinia.git
    cd VecinIA
    ```

2.  **Instala las dependencias**:
    Ejecuta el siguiente comando en la raíz del proyecto para instalar todas las librerías necesarias.
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno**:
    Crea un fichero llamado `.env` en la raíz del proyecto y añade tu clave de la API de OpenAI. Puedes obtener una desde la [plataforma de OpenAI](https://platform.openai.com/api-keys/).

    ```
    OPENAI_API_KEY='tu_api_key_aqui'
    ```

4.  **Inicia la aplicación**:
    Una vez instaladas las dependencias, puedes iniciar el servidor.
    ```bash
    npm start
    ```

5.  **Accede a la aplicación**:
    Abre tu navegador web y visita `http://localhost:3000` para empezar a usar VecinIA.

---
