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


# 📕Publications


## 2026

<div style="float: left; height:340px;" class="boxed">
<img align="left" src="../images/representative.png" width="200" alt/>
</div>

**Editing Physiological Signals in Videos Using Latent Representations**

<img src="../badges/cvpr_workshop.svg">

[Tianwen Zhou](https://zhoutianwen.com),
[Akshay Paruchuri](https://akshayparuchuri.github.io/),
[Josef Spjut](https://josef.spjut.me/),
and [Kaan Akşit](https://kaanaksit.com)

:material-web: [Project site](https://complightlab.com/publications/physiolatent/)  
:material-newspaper-variant: [Manuscript](https://arxiv.org/abs/2509.25348)

??? info ":material-tag-text: Bibtex"
    ```
    @inproceedings{zhou2026physiolatent,
      title = {Editing Physiological Signals in Videos Using Latent Representations},
      author = {Zhou, Tianwen and Paruchuri, Akshay and Spjut, Josef and Ak{\c{s}}it, Kaan},
      booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR) Workshops, 2nd Workshop on Subtle Visual Computing (SVC)},
      year = {2026}
    }
    ```

<br clear="left"/>



## 2025

<div style="float: left; height:340px;" class="boxed">
<img align="left" src="../images/ProDehaze.png" width="200" alt/>
</div>

**ProDehaze: Prompting Diffusion Models Toward Faithful Image Dehazing**

<img src="../badges/icme.svg"> Oral · Best Paper Nomination

[Tianwen Zhou](https://zhoutianwen.com),
[Jing Wang](https://scholar.google.com/citations?user=Z5s5kw4AAAAJ&hl=en),
[Songtao Wu](https://scholar.google.com/citations?user=JeMvxPwAAAAJ&hl=en),
and [Kuanhong Xu](https://dblp.org/pid/126/4380.html)

:material-newspaper-variant: [Manuscript](https://arxiv.org/abs/2503.17488)  
:material-file-code: [Code](https://github.com/TianwenZhou/ProDehaze)  
:material-web: [Project site](https://zhoutianwen.com/prodehaze)

??? info ":material-tag-text: Bibtex"
    ```
    @inproceedings{zhou2025prodehaze,
      title = {ProDehaze: Prompting Diffusion Models Toward Faithful Image Dehazing},
      author = {Zhou, Tianwen and Wang, Jing and Wu, Songtao and Xu, Kuanhong},
      booktitle = {IEEE International Conference on Multimedia and Expo (ICME)},
      year = {2025}
    }
    ```

<br clear="left"/>



## 2024

<div style="float: left; height:340px;" class="boxed">
<img align="left" src="../images/Difflare.png" width="200" alt/>
</div>

**Difflare: Removing Image Lens Flare with Latent Diffusion Models**

<img src="../badges/bmvc.svg">

[Tianwen Zhou](https://zhoutianwen.com),
[Qihao Duan](#),
and [Zitong Yu](https://zitongyu.github.io/)

:material-newspaper-variant: [Manuscript](https://bmva-archive.org.uk/bmvc/2024/papers/Paper_437/paper.pdf)  
:material-file-code: [Code](https://github.com/TianwenZhou/Difflare)  
:material-video-account: [Video](https://www.youtube.com/watch?v=naYsWT7SOn0)

??? info ":material-tag-text: Bibtex"
    ```
    @inproceedings{zhou2024difflare,
      title = {Difflare: Removing Image Lens Flare with Latent Diffusion Models},
      author = {Zhou, Tianwen and Duan, Qihao and Yu, Zitong},
      booktitle = {British Machine Vision Conference (BMVC)},
      year = {2024}
    }
    ```

<br clear="left"/>

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


