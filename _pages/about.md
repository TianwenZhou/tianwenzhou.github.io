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

# 🎓 Bio
Tianwen Zhou is currently an AI Researcher in Data Storage Technical Research Dept, Huawei Technology co. Ltd. He received Master's degree in Computer Graphics, Vision and Imaging from Department of Computer Science, University College London (UCL). He received Bachelor's degree in Mathematics and Applied Mathematics from Beijing Normal University.
He works on end-to-end acceleration of large-scale LLM inference, systematically optimizing the full inference stack—from inference frameworks and model operators, through RoCE-based cluster communication, to storage systems and KV cache offloading—within Huawei’s core data storage research team.

*Note: The one on the top of the picture **with tie and glasses** is Tianwen Zhou.*

<span class='anchor' id='educations'></span>

🔥 News
- [April 2026] Our paper "Editing Physiological Signals in Videos Using Latent Representations" was accepted to CVPR 2026 Workshop on Subtle Visual Computing!
- [Sep 2025] I joined Huawei Technologies Co., Ltd. as an AI Researcher!
- [Jun 2025] Our paper was selected as a Best Paper Candidate at ICME 2025!
- [Mar 2025] Our paper "ProDehaze: Prompting Diffusion Models Toward Faithful Image Dehazing" was accepted to IEEE ICME 2025 as an oral presentation!
- [Jul 2024] Our paper "Difflare: Removing Image Lens Flare with Latent Diffusion Models" was accepted to BMVC 2024!



# 📖 Educations
- *2024.09-2025.09*, Master's degree of science in **Computer Graphics, Vision and Imaging** (Distinction), School of Computer Science, University College London(UCL)
- *2020.09-2024.06*, Bachelor's degree of science in **Mathematics and Applied Mathematics**, School of Mathematical Science, Beijing Normal University(BNU)

# 🎖 Honors and Awards
- *2025*, Best Paper Nomination, ICME2025 (Top 1%)
- *2024*, Distinguished Graduates (Top 5%)
- *2024*, Distinguished Graduate Thesis Award (Top 5%)
- *2022-2023*, First-Class Academic Scholarship (Top 10%)
- *2022-2023*, First-Class Reward-based Scholarship (Top 10%)
- *2021-2022, 2022-2023*, Outstanding Student (Top 10%)


# 💻 Experiences
- *2025.09 -* **AI Researcher** in LLM, Data Storage Technical Research Dept, Huawei Technologies Co. Ltd.
- *2024.05 - 2024.12*, **Visiting Student** in Medical AI, X Lab, [Yale Institute for Global Health](https://medicine.yale.edu/), Yale University.
- *2023.08 - 2025.05*, **Intern Researcher** in Computer Vision, [AI Lab](https://ai.sony/), Research and Development Center, Sony(China)
- *2023.10 - 2024.10*, **Visiting Student** in Low-level Vision and Multi-modal Learning, Yu Vision (YUV) Group, Great Bay University, China
- *2023.07 - 2023.08*, **Visiting Student** in NeRF & 3D Reconstruction, [AIR Lab](https://air.tsinghua.edu.cn/en/), Tsinghua University, China 
- *2023.05 - 2023.08*, **Data Product Intern**, Bytedance
- *2023.01 - 2023.04*, **Data Operation Intern**, Didichuxing
- *2022.11 - 2023.06*, **Research Assistant** in Infrared Imaging, Intelligent Media Computer Laboratory, Beijing Normal University

# Publications

<h2 style="clear: both;">2026</h2>

<div style="overflow: auto; margin-bottom: 2rem;">
  <div style="float: left; width: 220px; margin-right: 20px;" class="boxed">
    <img src="/images/representative.png" width="200" alt="PhysioLatent teaser">
  </div>

  <div>
    <p style="margin-bottom: 0.4rem;"><strong>Editing Physiological Signals in Videos Using Latent Representations</strong></p>

    <p style="margin: 0.3rem 0;">
      <img src="/badges/cvpr_workshop.svg" alt="CVPR Workshop badge">
    </p>

    <p style="margin: 0.5rem 0;">
      <a href="https://zhoutianwen.com">Tianwen Zhou</a>,
      <a href="https://akshayparuchuri.github.io/">Akshay Paruchuri</a>,
      <a href="https://josef.spjut.me/">Josef Spjut</a>,
      and
      <a href="https://kaanaksit.com">Kaan Akşit</a>
    </p>

    <p style="margin: 0.5rem 0;">
      <a href="https://complightlab.com/publications/physiolatent/">Project site</a> |
      <a href="https://arxiv.org/abs/2509.25348">Manuscript</a>
    </p>

    <!-- 如果这篇已经被 Scholar 收录，就把下面的 PAPER_ID 换掉；没收录就先删掉这一行 -->
    <!-- <p style="margin: 0.5rem 0;"><strong>Citations:</strong> <span class='show_paper_citations' data='PAPER_ID_HERE'></span></p> -->

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

<div style="clear: both;"></div>

<h2 style="clear: both;">2025</h2>

<div style="overflow: auto; margin-bottom: 2rem;">
  <div style="float: left; width: 220px; margin-right: 20px;" class="boxed">
    <img src="/images/ProDehaze.png" width="200" alt="ProDehaze teaser">
  </div>

  <div>
    <p style="margin-bottom: 0.4rem;"><strong>ProDehaze: Prompting Diffusion Models Toward Faithful Image Dehazing</strong></p>

    <p style="margin: 0.3rem 0;">
      <img src="/badges/icme.svg" alt="ICME badge">
      <span style="margin-left: 8px;">Oral · Best Paper Nomination</span>
    </p>

    <p style="margin: 0.5rem 0;">
      <a href="https://zhoutianwen.com">Tianwen Zhou</a>,
      <a href="https://scholar.google.com/citations?user=Z5s5kw4AAAAJ&hl=en">Jing Wang</a>,
      <a href="https://scholar.google.com/citations?user=JeMvxPwAAAAJ&hl=en">Songtao Wu</a>,
      and
      <a href="https://dblp.org/pid/126/4380.html">Kuanhong Xu</a>
    </p>

    <p style="margin: 0.5rem 0;">
      <a href="https://zhoutianwen.com/prodehaze">Project site</a> |
      <a href="https://arxiv.org/abs/2503.17488">Manuscript</a> |
      <a href="https://github.com/TianwenZhou/ProDehaze">Code</a>
    </p>

    <p style="margin: 0.5rem 0;">
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

<div style="clear: both;"></div>

<h2 style="clear: both;">2024</h2>

<div style="overflow: auto; margin-bottom: 2rem;">
  <div style="float: left; width: 220px; margin-right: 20px;" class="boxed">
    <img src="/images/Difflare.png" width="200" alt="Difflare teaser">
  </div>

  <div>
    <p style="margin-bottom: 0.4rem;"><strong>Difflare: Removing Image Lens Flare with Latent Diffusion Models</strong></p>

    <p style="margin: 0.3rem 0;">
      <img src="/badges/bmvc.svg" alt="BMVC badge">
    </p>

    <p style="margin: 0.5rem 0;">
      <a href="https://zhoutianwen.com">Tianwen Zhou</a>,
      Qihao Duan,
      and
      <a href="https://zitongyu.github.io/">Zitong Yu</a>
    </p>

    <p style="margin: 0.5rem 0;">
      <a href="https://bmva-archive.org.uk/bmvc/2024/papers/Paper_437/paper.pdf">Manuscript</a> |
      <a href="https://github.com/TianwenZhou/Difflare">Code</a> |
      <a href="https://www.youtube.com/watch?v=naYsWT7SOn0">Video</a>
    </p>

    <p style="margin: 0.5rem 0;">
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

<div style="clear: both;"></div>

# 📪 Academic Services
**Congress Member**
* Member of Chinese Congress on Image and Graphics (CCIG)
* IEEE Student Member
* IEEE Signal Processing Society (SPS) Member
* Member of British Machine Vision Association (BMVA) 
  
**Conference Reviewer** 
* IEEE International Conference on Multimedia and Expo (ICME) 25',26'
* International Conference on Learning Representations (ICLR) 25',26'
* SciPy Proceedings 25'
* IEEE International Conference on Advanced Visual and Signal-Based Systems (AVSS) 25'
* British Machine Vision Conference (BMVC) 24'
* IEEE International Joint Conference on Biometrics (IJCB) 24'
* Conference on Neural Information Processing Systems (NeurIPS) 25'

# 🔬 Invention Patents         
* A method, device, system, and storage medium for image lens flare removal, granted. (图像杂散光去除方法、装置、系统和介质, CN118781007A)
* A method, device, equipment and storage medium for generating medical image reports. (医学影像报告生成方法、装置、设备和储存)

<span class='anchor' id='events'></span>
# 🛫️ Events
* Attended [ICME 2025, Nantes, France](https://2025.ieeeicme.org/)
* Attended [BMVC 2024, Glasgow, UK](https://bmvc2024.org/)


<span class='anchor' id='surveys'></span>


