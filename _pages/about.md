---
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

{% if site.google_scholar_stats_use_cdn %}
{% assign gsDataBaseUrl = "https://cdn.jsdelivr.net/gh/" | append: site.repository | append: "@" %}
{% else %}
{% assign gsDataBaseUrl = "https://raw.githubusercontent.com/" | append: site.repository | append: "/" %}
{% endif %}
{% assign url = gsDataBaseUrl | append: "google-scholar-stats/gs_data_shieldsio.json" %}

<span class='anchor' id='about-me'></span>

# Bio

Tianwen Zhou is currently an AI Researcher in the Data Storage Technical Research Department at Huawei Technologies Co., Ltd. He received his Master's degree in Computer Graphics, Vision and Imaging from the Department of Computer Science, University College London (UCL). He received his Bachelor's degree in Mathematics and Applied Mathematics from Beijing Normal University. He works on end-to-end acceleration of large-scale LLM inference, systematically optimizing the full inference stack—from inference frameworks and model operators, through RoCE-based cluster communication, to storage systems and KV cache offloading—within Huawei’s core data storage research team.

*Note: The one on the top of the picture **with tie and glasses** is Tianwen Zhou.*

<span class='anchor' id='news'></span>

# News

- **Apr 2026**: Our paper *Editing Physiological Signals in Videos Using Latent Representations* was accepted to the CVPR 2026 Workshop on Subtle Visual Computing.
- **Sep 2025**: I joined Huawei Technologies Co., Ltd. as an AI Researcher.
- **Jun 2025**: Our paper was selected as a Best Paper Candidate at ICME 2025.
- **Mar 2025**: Our paper *ProDehaze: Prompting Diffusion Models Toward Faithful Image Dehazing* was accepted to IEEE ICME 2025 as an oral presentation.
- **Jul 2024**: Our paper *Difflare: Removing Image Lens Flare with Latent Diffusion Models* was accepted to BMVC 2024.

<span class='anchor' id='education'></span>

# Education

- *2024.09 – 2025.09*, Master's degree in **Computer Graphics, Vision and Imaging** (Distinction), Department of Computer Science, University College London
- *2020.09 – 2024.06*, Bachelor's degree in **Mathematics and Applied Mathematics**, School of Mathematical Sciences, Beijing Normal University

<span class='anchor' id='honors-and-awards'></span>

# Honors and Awards

- *2025*, Best Paper Nomination, ICME 2025
- *2024*, Distinguished Graduate
- *2024*, Distinguished Graduate Thesis Award
- *2022–2023*, First-Class Academic Scholarship
- *2022–2023*, First-Class Reward-based Scholarship
- *2021–2023*, Outstanding Student

<span class='anchor' id='experience'></span>

# Experience

- *2025.09 – Present*, **AI Researcher**, Data Storage Technical Research Department, Huawei Technologies Co., Ltd.
- *2024.11 - 2025.09*, **Intern Student**, Computational Light Laboratory, University College London
- *2024.05 – 2024.12*, **Visiting Student**, Medical AI, X Lab, [Yale Institute for Global Health](https://medicine.yale.edu/), Yale University
- *2023.08 – 2025.05*, **Intern Researcher**, Computer Vision, [AI Lab](https://ai.sony/), Research and Development Center, Sony (China)
- *2023.10 – 2024.10*, **Visiting Student**, Low-level Vision and Multi-modal Learning, Yu Vision Group, Great Bay University
- *2023.07 – 2023.08*, **Visiting Student**, NeRF and 3D Reconstruction, [AIR Lab](https://air.tsinghua.edu.cn/en/), Tsinghua University
- *2023.05 – 2023.08*, **Data Product Intern**, ByteDance
- *2023.01 – 2023.04*, **Data Operation Intern**, DiDi Chuxing
- *2022.11 – 2023.06*, **Research Assistant**, Infrared Imaging, Intelligent Media Computer Laboratory, Beijing Normal University

<span class='anchor' id='publications'></span>

# Publications

## 2026

<div style="display:flex; gap:20px; align-items:flex-start; margin-bottom:2rem; flex-wrap:wrap;">
  <div class="boxed" style="width:220px; flex:0 0 220px;">
    <img src="/images/representative.png" width="200" alt="PhysioLatent teaser">
  </div>
  <div style="flex:1 1 520px; min-width:280px;">
    <p style="margin:0 0 0.35rem 0;"><strong>Editing Physiological Signals in Videos Using Latent Representations</strong></p>
    <p style="margin:0.2rem 0 0.6rem 0;"><strong>CVPR 2026 Workshop on Subtle Visual Computing (SVC)</strong></p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <a href="https://zhoutianwen.com">Tianwen Zhou</a>,
      <a href="https://akshayparuchuri.github.io/">Akshay Paruchuri</a>,
      <a href="https://josef.spjut.me/">Josef Spjut</a>,
      and
      <a href="https://kaanaksit.com">Kaan Akşit</a>
    </p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <a href="https://complightlab.com/publications/physiolatent/">Project site</a> |
      <a href="https://arxiv.org/abs/2509.25348">Manuscript</a>
    </p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <strong>Citations:</strong>
      <span class='show_paper_citations' data='Km1ZrkYAAAAJ:IjCSPb-OGe4C'></span>
    </p>
    <details>
      <summary>BibTeX</summary>
      <pre><code>@inproceedings{zhou2026physiolatent,
  title = {Editing Physiological Signals in Videos Using Latent Representations},
  author = {Zhou, Tianwen and Paruchuri, Akshay and Spjut, Josef and Ak{\c{s}}it, Kaan},
  booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR) Workshops, 2nd Workshop on Subtle Visual Computing (SVC)},
  year = {2026}
}</code></pre>
    </details>
  </div>
</div>

## 2025

<div style="display:flex; gap:20px; align-items:flex-start; margin-bottom:2rem; flex-wrap:wrap;">
  <div class="boxed" style="width:220px; flex:0 0 220px;">
    <img src="/images/ProDehaze.png" width="200" alt="ProDehaze teaser">
  </div>
  <div style="flex:1 1 520px; min-width:280px;">
    <p style="margin:0 0 0.35rem 0;"><strong>ProDehaze: Prompting Diffusion Models Toward Faithful Image Dehazing</strong></p>
    <p style="margin:0.2rem 0 0.6rem 0;"><strong>ICME 2025</strong> · Oral · Best Paper Nomination</p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <a href="https://zhoutianwen.com">Tianwen Zhou</a>,
      <a href="https://scholar.google.com/citations?user=Z5s5kw4AAAAJ&hl=en">Jing Wang</a>,
      <a href="https://scholar.google.com/citations?user=JeMvxPwAAAAJ&hl=en">Songtao Wu</a>,
      and
      <a href="https://dblp.org/pid/126/4380.html">Kuanhong Xu</a>
    </p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <a href="https://zhoutianwen.com/prodehaze">Project site</a> |
      <a href="https://arxiv.org/abs/2503.17488">Manuscript</a> |
      <a href="https://github.com/TianwenZhou/ProDehaze">Code</a>
    </p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <strong>Citations:</strong>
      <span class='show_paper_citations' data='3WQTKocAAAAJ:WF5omc3nYNoC'></span>
    </p>
    <details>
      <summary>BibTeX</summary>
      <pre><code>@inproceedings{zhou2025prodehaze,
  title = {ProDehaze: Prompting Diffusion Models Toward Faithful Image Dehazing},
  author = {Zhou, Tianwen and Wang, Jing and Wu, Songtao and Xu, Kuanhong},
  booktitle = {IEEE International Conference on Multimedia and Expo (ICME)},
  year = {2025}
}</code></pre>
    </details>
  </div>
</div>

## 2024

<div style="display:flex; gap:20px; align-items:flex-start; margin-bottom:2rem; flex-wrap:wrap;">
  <div class="boxed" style="width:220px; flex:0 0 220px;">
    <img src="/images/Difflare.png" width="200" alt="Difflare teaser">
  </div>
  <div style="flex:1 1 520px; min-width:280px;">
    <p style="margin:0 0 0.35rem 0;"><strong>Difflare: Removing Image Lens Flare with Latent Diffusion Models</strong></p>
    <p style="margin:0.2rem 0 0.6rem 0;"><strong>BMVC 2024</strong></p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <a href="https://zhoutianwen.com">Tianwen Zhou</a>,
      Qihao Duan,
      and
      <a href="https://zitongyu.github.io/">Zitong Yu</a>
    </p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <a href="https://bmva-archive.org.uk/bmvc/2024/papers/Paper_437/paper.pdf">Manuscript</a> |
      <a href="https://github.com/TianwenZhou/Difflare">Code</a> |
      <a href="https://www.youtube.com/watch?v=naYsWT7SOn0">Video</a>
    </p>
    <p style="margin:0.3rem 0 0.6rem 0;">
      <strong>Citations:</strong>
      <span class='show_paper_citations' data='Km1ZrkYAAAAJ:u-x6o8ySG0sC'></span>
    </p>
    <details>
      <summary>BibTeX</summary>
      <pre><code>@inproceedings{zhou2024difflare,
  title = {Difflare: Removing Image Lens Flare with Latent Diffusion Models},
  author = {Zhou, Tianwen and Duan, Qihao and Yu, Zitong},
  booktitle = {British Machine Vision Conference (BMVC)},
  year = {2024}
}</code></pre>
    </details>
  </div>
</div>

<span class='anchor' id='academic-service'></span>

# Academic Service

**Professional Memberships**
- Member, Chinese Congress on Image and Graphics (CCIG)
- IEEE Student Member
- Member, IEEE Signal Processing Society
- Member, British Machine Vision Association (BMVA)

**Conference Reviewing**
- IEEE International Conference on Multimedia and Expo (ICME), 2025–2026
- International Conference on Learning Representations (ICLR), 2025–2026
- SciPy Proceedings, 2025
- IEEE International Conference on Advanced Video and Signal-Based Surveillance (AVSS), 2025
- British Machine Vision Conference (BMVC), 2024
- IEEE International Joint Conference on Biometrics (IJCB), 2024
- Conference on Neural Information Processing Systems (NeurIPS), 2025

<span class='anchor' id='patents'></span>

# Patents

- *A method, device, system, and storage medium for image lens flare removal*, granted. (图像杂散光去除方法、装置、系统和介质, CN118781007A)
- *A method, device, equipment and storage medium for generating medical image reports.*

<span class='anchor' id='events'></span>

# Events

- Attended [ICME 2025, Nantes, France](https://2025.ieeeicme.org/)
- Attended [BMVC 2024, Glasgow, UK](https://bmvc2024.org/)
