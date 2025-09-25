# 🔒 Deployment Security Guide

**Fecha**: Diciembre 2025
**Estado**: ✅ CORREGIDO - Credenciales securizadas

## ⚠️ PROBLEMA RESUELTO

### Lo que estaba mal:
- Archivos `.env.production` y `.env.test` con credenciales reales trackeados en git
- Repositorio público exponiendo credenciales de Supabase
- `.gitignore` incompleto permitiendo tracking de archivos de entorno

### Lo que se corrigió:
- ✅ Removidos `.env.production` y `.env.test` del tracking de git
- ✅ Actualizado `.gitignore` para prevenir futuros problemas
- ✅ Creados archivos `.example` seguros para templates
- ✅ Verificado que no hay credenciales hardcodeadas en código

## 🛡️ PROCESO SEGURO DE DEPLOYMENT

### Para Desarrollo Local

1. **Copia archivo de ejemplo**:
   ```bash
   cp .env.example .env
   ```

2. **Rellena con tus credenciales de desarrollo**:
   ```bash
   # .env (solo local, nunca hacer commit)
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
   VITE_APP_URL=http://localhost:8080
   ```

### Para Testing/Staging

1. **Copia archivo de ejemplo**:
   ```bash
   cp .env.test.example .env.test
   ```

2. **Usa credenciales de TEST (diferentes a producción)**:
   ```bash
   # .env.test (solo local, nunca hacer commit)
   VITE_SUPABASE_URL=https://tu-proyecto-test.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_test_anon_key_aqui
   ```

### Para Producción (Vercel/Netlify)

**❌ NUNCA hagas esto**:
```bash
# MAL - Nunca crear .env.production con credenciales reales
echo "VITE_SUPABASE_URL=real_url" > .env.production
git add .env.production  # ¡PELIGRO!
```

**✅ Método correcto**:

1. **En Vercel Dashboard**:
   - Ve a Project Settings > Environment Variables
   - Añade cada variable individualmente:
     - `VITE_SUPABASE_URL` = tu URL de producción
     - `VITE_SUPABASE_ANON_KEY` = tu anon key de producción
     - `VITE_APP_URL` = tu dominio de producción

2. **En Netlify Dashboard**:
   - Ve a Site Settings > Environment Variables
   - Añade las mismas variables

3. **Para otros providers**:
   - Usa sus sistemas de environment variables
   - NUNCA commits archivos con credenciales reales

## 🔧 CONFIGURACIÓN DE .gitignore

Tu `.gitignore` ahora incluye:
```gitignore
# Environment variables (SECURITY: Never commit these)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
# CRITICAL: Also ignore environment files without .local suffix
.env.production
.env.test
.env.development
```

## 🚨 ACCIONES DE EMERGENCIA

### Si accidentalmente commiteas credenciales:

1. **Inmediatamente rota las credenciales**:
   - Ve a Supabase Dashboard
   - Genera nuevas API keys
   - Actualiza en todas las plataformas

2. **Remueve del git**:
   ```bash
   git rm --cached archivo_con_credenciales
   git commit -m "Remove credentials from tracking"
   git push
   ```

3. **Si el repo es público, considera**:
   - Limpiar historial de git con BFG Repo-Cleaner
   - O archivar repo y crear uno nuevo sin historial

### Pre-commit hooks (recomendado):

Instala herramientas para detectar credenciales:
```bash
npm install --save-dev @commitlint/cli husky
# Configura hooks para verificar archivos antes de commit
```

## ✅ CHECKLIST DE SEGURIDAD

Antes de cada deployment, verifica:

- [ ] Archivos `.env*` no están en `git status`
- [ ] Variables de entorno configuradas en platform (Vercel/Netlify)
- [ ] Credenciales de test diferentes a producción
- [ ] `.gitignore` actualizado y funcionando
- [ ] Sin credenciales hardcodeadas en código
- [ ] Row Level Security activado en Supabase
- [ ] Dominios permitidos configurados en Supabase

## 📋 ARCHIVOS SEGUROS PARA COMMIT

✅ **Sí puedes commitear**:
- `.env.example`
- `.env.production.example`
- `.env.test.example`
- Este archivo de documentación

❌ **NUNCA commitees**:
- `.env` (desarrollo local)
- `.env.production` (credenciales reales)
- `.env.test` (credenciales reales)
- Cualquier archivo con credenciales reales

## 🔄 ROTACIÓN DE CREDENCIALES

**Frecuencia recomendada**: Cada 3-6 meses o inmediatamente si:
- Sospecha de exposición
- Empleado deja el equipo
- Credenciales accidentalmente commitadas
- Actividad sospechosa detectada

**Proceso**:
1. Genera nuevas credenciales en Supabase
2. Actualiza en todas las plataformas
3. Verifica que la app funciona
4. Revoca credenciales antiguas
5. Documenta el cambio

---

**🚀 RESULTADO**: Tu aplicación ahora sigue las mejores prácticas de seguridad para manejo de credenciales y deployment.