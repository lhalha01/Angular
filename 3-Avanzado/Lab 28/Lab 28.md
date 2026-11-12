
# 🐳 Tutorial: Desplegar Aplicación Angular en Docker/Podman

**Aplicación**: Gestión de Usuarios
**Framework**: Angular 21
**Guía para**: Docker & Podman

---

## 📋 Tabla de Contenidos

### Configuración Inicial

1. [Requisitos Previos](#requisitos-previos)
2. [Conceptos Básicos](#conceptos-básicos)
3. [Preparación de la Aplicación](#preparación-de-la-aplicación)

### Docker

4. [🐳 DOCKER](#-docker)

   - [Dockerfile Optimizado](#dockerfile-optimizado)
   - [Archivo .dockerignore](#archivo-dockerignore)
   - [Docker Compose](#docker-compose)
   - [Construcción y Ejecución](#construcción-y-ejecución)
   - [Comandos Útiles](#comandos-útiles)
   - [Troubleshooting](#troubleshooting)
   - [Troubleshooting en Podman](#troubleshooting-en-podman)
5. [📚 Recursos Adicionales](#recursos-adicionales)

---

## 🔧 Requisitos Previos

### Windows

```bash
# Opción 1: Docker Desktop (incluye Docker y Docker Compose)
# Descargar desde: https://www.docker.com/products/docker-desktop

# Opción 2: Podman (alternativa ligera a Docker)
# Instalable desde Windows Package Manager:
winget install Podman

# Verificar instalación
docker --version
# o
podman --version
```

---

## 💡 Conceptos Básicos

### ¿Qué es Docker?

- **Contenedor**: Empaquetamiento de la aplicación + dependencias en una imagen aislada
- **Imagen**: Blueprint/plantilla para crear contenedores
- **Dockerfile**: Archivo con instrucciones para construir la imagen
- **Docker Compose**: Orquestar múltiples contenedores

### ¿Qué es Podman?

- Drop-in replacement de Docker (compatible con los mismos comandos)
- Sin daemon central (más seguro)
- Soporta BuildKit de forma nativa

---

## 📦 Preparación de la Aplicación

### 1. Verificar que la app compila correctamente

```bash
# En la raíz del proyecto
npm install
npm run build

# Verificar que se creó la carpeta dist/
ls dist/gestion-usuarios-app/browser/
```

### 2. Probar la app localmente (antes de dockerizar)

```bash
npm start
# Accede a http://localhost:4200
```

---

# 🐳 DOCKER

## 🐋 Dockerfile Optimizado

### Opción 1: Dockerfile Multi-Stage (RECOMENDADO)

Archivo `Dockerfile` en la raíz del proyecto (Multi-Stage - RECOMENDADO):

```dockerfile
# ============================================
# Etapa 1: BUILD - Compilar la aplicación Angular
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias (solo producción)
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Construir la aplicación Angular
RUN npm run build

# ============================================
# Etapa 2: RUNTIME - Servir con Nginx
# ============================================
FROM nginx:alpine

# Metadatos
LABEL maintainer="Angular Course Team"
LABEL description="Gestión de Usuarios - Angular 21 Application"

# Copiar archivos construidos desde etapa builder al servidor nginx
COPY --from=builder /app/dist/gestion-usuarios-app/browser /usr/share/nginx/html

# Exponer puerto HTTP
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Comando por defecto - ejecutar nginx en modo foreground
CMD ["nginx", "-g", "daemon off;"]
```

**Ventajas:**

- ✅ Imagen final muy pequeña (~50MB)
- ✅ No incluye herramientas de build
- ✅ Mejor seguridad en producción

### Opción 2: Dockerfile Alternativo (Desarrollo)

```dockerfile
# ============================================
# Etapa 1: BUILD - Compilar la aplicación Angular
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias (solo producción)
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Construir la aplicación Angular
RUN npm run build

# ============================================
# Etapa 2: RUNTIME - Servir con Nginx
# ============================================
FROM nginx:alpine

# Metadatos
LABEL maintainer="Angular Course Team"
LABEL description="Gestión de Usuarios - Angular 21 Application"

# Copiar archivos construidos desde etapa builder al servidor nginx
COPY --from=builder /app/dist/gestion-usuarios-app/browser /usr/share/nginx/html

# Exponer puerto HTTP
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Comando por defecto - ejecutar nginx en modo foreground
CMD ["nginx", "-g", "daemon off;"]

```

---

## 🚫 Archivo .dockerignore

Crea `.dockerignore` en la raíz para excluir archivos innecesarios:

```
.git
.gitignore
README*.md
DOCKER_DEPLOYMENT.md
REACTIVE_SIGNALS_GUIDE.md
SIGNALS_ARCHITECTURE.md
README_Signals.md
README_EMBEDME.md

node_modules/
npm-debug.log
dist/
.angular/
.vscode/
.vs/
.idea/
*.swp
*.swo
*~
.DS_Store
coverage/
.env
.env.local
*.log

# Git
.git/
.gitignore
.gitattributes

# IDEs
.vscode/
.idea/
*.code-workspace
*.suo
*.user

# System
.DS_Store
Thumbs.db
```

---

## 🐳 Docker Compose

**Docker Compose** orquesta y ejecuta contenedores desde un archivo YAML centralizado. Para tu app es **opcional pero una buena práctica**: simplifica el despliegue y mejora la mantenibilidad cuando la app crece.

Crea `docker-compose.yml` en la raíz:

```yaml
version: '3.8'

services:
  gestion-usuarios-app:
    build: .
    container_name: gestion-usuarios-app
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3

networks:
  default:
    driver: bridge
```

---

## 🚀 Construcción y Ejecución

### Con Docker

#### 1. Construir la imagen

```bash
# Opción A: Construir desde Dockerfile
docker build -t gestion-usuarios-app:latest .

# Opción B: Construir desde docker-compose
docker compose build
```

#### 2. Ejecutar contenedor

```bash
# Opción A: Desde imagen construida
docker run -d \
  --name gestion-usuarios \
  -p 80:80 \
  gestion-usuarios-app:latest

# Opción B: Con docker-compose
docker compose up -d

# Opción C: Con variables de entorno
docker run -d \
  --name gestion-usuarios \
  -p 8080:80 \
  -e NODE_ENV=production \
  gestion-usuarios-app:latest
```

#### 3. Ver logs

```bash
# Logs en tiempo real
docker logs -f gestion-usuarios

# Últimos 100 líneas
docker logs --tail 100 gestion-usuarios
```

#### 4. Acceder a la aplicación

```
http://localhost
```

#### 5. Detener y limpiar

```bash
# Detener contenedor
docker stop gestion-usuarios

# Eliminar contenedor
docker rm gestion-usuarios

# Evaluar imagen
docker rmi gestion-usuarios-app:latest

# Con docker-compose
docker compose down
```

### Con Podman

Podman usa exactamente los mismos comandos que Docker (drop-in replacement):

#### 1. Construir la imagen

```bash
# Opción A: Construir desde Dockerfile
podman build -t gestion-usuarios-app:latest .

# Opción B: Construir desde podman-compose
podman compose build
```

#### 2. Ejecutar contenedor

```bash
# Opción A: Desde imagen construida
podman run -d \
  --name gestion-usuarios \
  -p 80:80 \
  gestion-usuarios-app:latest

# Opción B: Con podman-compose
podman compose up -d
```

#### 3. Ver logs

```bash
# Logs en tiempo real
podman logs -f gestion-usuarios

# Últimos 100 líneas
podman logs --tail 100 gestion-usuarios
```

#### 4. Detener y limpiar

```bash
# Detener contenedor
podman stop gestion-usuarios

# Eliminar contenedor
podman rm gestion-usuarios

# Eliminar imagen
podman rmi gestion-usuarios-app:latest

# Con podman-compose
podman compose down
```

---

## � Comandos Útiles

```bash
# Ver todas las imágenes
docker images

# Ver contenedores activos
docker ps

# Ver todos los contenedores (incluidos detenidos)
docker ps -a

# Inspeccionar contenedor
docker inspect gestion-usuarios

# Ver estadísticas en tiempo real
docker stats

# Ejecutar comando dentro del contenedor
docker exec gestion-usuarios nginx -t

# Copiar archivos del contenedor
docker cp gestion-usuarios:/usr/share/nginx/html ./backup

# Guardar imagen
docker save gestion-usuarios-app:latest -o app.tar

# Cargar imagen desde tar
docker load -i app.tar

# Limpiar recursos no utilizados
docker system prune -a
```

---

---

## 🔍 Troubleshooting

### Error: "Cannot find module..."

```bash
# Reconstruir sin caché
docker build --no-cache -t gestion-usuarios-app:latest .
```

### Error: "Port 80 already in use"

```bash
# Usar puerto diferente
docker run -d -p 8080:80 gestion-usuarios-app:latest

# O matar proceso en puerto 80
# Windows:
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Linux:
sudo lsof -i:80
sudo kill -9 <PID>
```

### Angular app no carga (error 404)

```bash
# Verificar que nginx está sirviendo correctamente
docker exec gestion-usuarios ls -la /usr/share/nginx/html/

# Ver logs de nginx
docker exec gestion-usuarios cat /var/log/nginx/error.log
```

### Caché de npm ralentiza builds

```bash
# Usar npm ci en lugar de npm install en Dockerfile
# (ya incluido en Dockerfile optimizado)
```

### Imagen muy grande

```bash
# Usar multi-stage build (ya recomendado)
# Imagen final debe ser ~50-100MB

# Ver tamaño de imagen
docker images gestion-usuarios-app

# Optimizar más:
# 1. Usar alpine en lugar de buster
# 2. Excluir archivos innecesarios en .dockerignore
# 3. Comprimir con nginx gzip
```

---

## 🔍 Troubleshooting en Podman

### Caché de npm ralentiza builds

```bash
# Usar npm ci en lugar de npm install en Dockerfile
# (ya incluido en Dockerfile optimizado)
```

### Imagen muy grande

```bash
# Usar multi-stage build (ya recomendado)
# Imagen final debe ser ~50-100MB

# Ver tamaño de imagen
docker images gestion-usuarios-app

# Optimizar más:
# 1. Usar alpine en lugar de buster
# 2. Excluir archivos innecesarios en .dockerignore
# 3. Comprimir con nginx gzip
```

### Error: "Cannot find module..." (Podman)

```bash
# Reconstruir sin caché
podman build --no-cache -t gestion-usuarios-app:latest .
```

### Error: "Port 80 already in use" (Podman)

```bash
# Usar puerto diferente
podman run -d -p 8080:80 gestion-usuarios-app:latest

# Linux: matar proceso en puerto 80
sudo lsof -i:80
sudo kill -9 <PID>
```

### Rootless mode issues

```bash
# En Podman rootless, algunos volumes pueden necesitar configuración especial
podman run -d \
  --userns=keep-id \
  -p 80:80 \
  gestion-usuarios-app:latest
```

---
