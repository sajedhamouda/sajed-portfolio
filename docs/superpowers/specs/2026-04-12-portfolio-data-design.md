# Portfolio Data Refactor – Design Specification

**Date:** 2026-04-12
**Project:** Sajed Portfolio
**Scope:** Extract the hard‑coded project array from `PortfolioGrid.astro` into a dedicated TypeScript data module, use Astro Image component for optimized assets, and optionally add a modal for full‑size view.

---

## 1. Goals & Success Criteria
- **Reduce component size**: Remove the ~65 KB inline array from `PortfolioGrid.astro`.
- **Typed data source**: Provide a `Project[]` export with full type safety.
- **Optimized images**: Serve thumbnails and full‑size images via Astro’s `<Image>` (WebP/AVIF, lazy‑load, blur placeholder).
- **Live demo links**: Each card displays a button linking to the live project URL.
- **Optional modal**: Clicking a card can open a modal showing the full‑size image and description.
- **Bundle impact**: Target a bundle size reduction of ≥150 KB and a measurable TTI improvement.

---

## 2. File Changes
| File | Action | Reason |
|------|--------|--------|
| `src/data/projects.ts` | **Create** new module exporting `Project[]` | Centralizes data, provides type safety, easy future edits. |
| `src/components/PortfolioGrid.astro` | **Modify**: remove inline array, import data, replace raw `<img>` with `<Image>` component, add live‑demo button, hook optional modal. | Streamlines component, leverages shared utilities, improves performance. |
| `src/assets/images/` | **Create** folder for thumbnails and full‑size assets. | Source for Astro Image optimization. |
| `src/components/ProjectModal.astro` | **Create** (optional) reusable modal for full‑size image view. | Improves UX for detailed project showcase. |
| `src/components/PortfolioGrid.module.css` | **Update** (if needed) to style new image classes and modal overlay. | Align visual styling with new markup. |
| `docs/superpowers/specs/2026-04-12-portfolio-data-design.md` | **Create** (this file) | Document design for review and version control. |

---

## 3. Data Module (`src/data/projects.ts`)
```ts
export interface Project {
  title: string;
  category: string;
  shortDescription: string;
  thumbnail: string;   // relative path in src/assets/images/
  fullImage: string;   // relative path in src/assets/images/
  liveDemoUrl: string;
}

export const projects: Project[] = [
  {
    title: "Project One",
    category: "Web Design",
    shortDescription: "A sleek landing page with responsive layout.",
    thumbnail: "/src/assets/images/project-1-thumb.webp",
    fullImage: "/src/assets/images/project-1-full.webp",
    liveDemoUrl: "https://demo.example.com/project-1"
  },
  // … five more entries …
];
```
*Populate the array with the six real projects you wish to showcase.*

---

## 4. Component Refactor (`PortfolioGrid.astro`)
1. **Import data**:
   ```astro
   ---
   import { projects } from "../../data/projects.ts";
   import { observeVisibility } from "../../utils/animations.js";
   import { Image } from "astro:assets";
   let selectedProject: Project | null = null;
   const openModal = (proj: Project) => (selectedProject = proj);
   const closeModal = () => (selectedProject = null);
   ---
   ```
2. **Render cards** (simplified):
   ```astro
   <div class="portfolio-grid" client:load>
     {#each projects as project}
       <div class="card" onClick={() => openModal(project)}>
         <Image src={project.thumbnail}
                alt={project.title}
                width={400}
                height={300}
                loading="lazy"
                placeholder="blur"
                formats={["webp", "avif"]} />
         <div class="overlay">
           <h3>{project.title}</h3>
           <p>{project.shortDescription}</p>
           <a href={project.liveDemoUrl} target="_blank" rel="noopener" class="demo-btn">Live Demo</a>
         </div>
       </div>
     {/each}
   </div>
   {#if selectedProject}
     <ProjectModal project={selectedProject} onClose={closeModal} />
   {/if}
   ```
3. **Animation hook** (run after mount):
   ```astro
   <script>
     import { onMount } from "astro/runtime";
     onMount(() => {
       const cards = document.querySelectorAll('.card');
       observeVisibility(cards, 'visible', 100);
     });
   </script>
   ```
4. **CSS updates**: ensure `.card img` uses `object-fit: cover;` and add `.visible` transition classes.

---

## 5. Optional Modal (`ProjectModal.astro`)
A lightweight modal that receives a `Project` prop and displays `fullImage` plus a close button.
```astro
---
interface Props { project: Project; onClose: () => void; }
const { project, onClose } = Astro.props;
---
<div class="modal" onClick={onClose}>
  <div class="content" onClick={e => e.stopPropagation()}>
    <button class="close" onClick={onClose}>×</button>
    <Image src={project.fullImage} alt={project.title} loading="lazy" formats={["webp","avif"]} />
    <h2>{project.title}</h2>
    <p>{project.shortDescription}</p>
    <a href={project.liveDemoUrl} target="_blank" rel="noopener" class="demo-link">Visit Live Demo</a>
  </div>
</div>
```
*Styling omitted for brevity; use a dark semi‑transparent backdrop and centered content.*

---

## 6. Migration Checklist
- [ ] Add `src/data/projects.ts` with the six real entries.
- [ ] Place thumbnail & full images in `src/assets/images/`.
- [ ] Update `PortfolioGrid.astro` as described.
- [ ] Add (optional) `ProjectModal.astro` and import it.
- [ ] Adjust CSS module for new classes (`.card`, `.overlay`, `.visible`).
- [ ] Run `npm run dev` and verify:
  - Cards show correct thumbnails.
  - Live‑Demo button opens the URL.
  - Hover overlay works.
  - Modal opens/closes if implemented.
  - No console errors.
- [ ] Build production (`npm run build`) and confirm bundle size reduction.
- [ ] Commit all changes.

---

## 7. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Image paths wrong → broken images | Use relative paths from project root; verify each image loads locally before commit. |
| TypeScript compile error if a field missing | Enforce the `Project` interface; IDE will highlight missing fields. |
| Modal adds extra JS bundle size | Keep modal lightweight; load it only when `selectedProject` is set (client:load already used). |
| Live‑demo URLs open in a new tab without `rel="noopener"` → security risk | Include `rel="noopener"` on every external link. |

---

**Next step:** I will commit this design document and run a quick self‑review. Please review the spec file (`docs/superpowers/specs/2026-04-12-portfolio-data-design.md`) and let me know if any changes are needed before we move to the implementation plan.
