# HACS Publishing Checklist

Use this when publishing Home Weather to HACS.

## Before First Publish

1. **GitHub Repository**
   - Create repo (e.g. `zodyking/Home-Climate`)
   - Add description: "Climate monitoring and automation dashboard for Home Assistant"
   - Add topics: `home-assistant`, `hacs`, `climate`, `automation`, `dashboard`
   - Enable Issues

2. ** manifest.json URLs**
   - Update `documentation` and `issue_tracker` if repo URL differs
   - Update `codeowners` to your GitHub username (e.g. `@zodyking`)

3. **Brand Icon**
   - `custom_components/home_weather/brand/icon.png` should exist
   - Recommended size: 256x256 or 128x128 PNG
   - Current icon may be large; replace with optimized version if needed

## Add to HACS (Custom Repo)

1. HACS → Settings → Repositories
2. Add: `https://github.com/zodyking/Home-Climate`
3. Category: Integration
4. Add

## Optional: GitHub Release

For version selection in HACS:
- Create release tag `v1.0.0`
- HACS will offer releases when available
