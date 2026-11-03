---
title: 我把这个站写成一台 Windows XP：零依赖、零构建、关掉 JS 也能读
date: 2026-11-03
tag: LINUXLINKING.GITHUB.IO
lede: 这个站是一台 Windows XP 桌面，原生 HTML、CSS 和 ES module 手写，一个只用 Python 标准库的脚本组装页面，没有框架、没有 npm、没有 CDN、没有网络字体，关掉 JavaScript 也能把文章读完。
---

## 三条硬条件，把实现方式锁死了

先把问题摆出来。这个站要同时满足三件事：住在 GitHub Pages 上，只发静态文件；内容有中英两版；搜索和社交卡片得能读到正文，而读的人可能压根不执行 JavaScript。

三条一起成立，实现方式几乎没得挑：没有服务端运行时，依赖后端的功能都得砍；不跑 JavaScript 的访客也要读到正文，内容只能在构建期渲染；两种语言要同时可读，就不能各做一份页面。

剩下的只有形状。七个项目、七篇文章、两种语言，手写就是改一个标题要动十几个地方。我要的是改数据、跑一条命令。

然后我选了 Windows XP 当这个形状。不是怀旧，是因为它天生就长在「静态文件 + 一点脚本」上：桌面是 HTML，窗口是 iframe，任务栏是 CSS 粘底，图标是图片，没有一样东西需要服务端。

## 零依赖零到哪：一份只用标准库的构建脚本

整个站只有一条构建命令，`python tools/build.py`。它只 import 标准库（argparse、hashlib、html、json、re、sys、pathlib）和同目录的 markdown、xp_icons 两个本地模块。没有 pip install，也没有 node_modules。

脚本做七件事：套 layouts 和 pages 生成根页面；按 data/posts.json 渲染每篇文章，正文用 tools/markdown.py 在构建期变成 HTML；按 data/projects.json 渲染每个项目页；给内容页套上 IE 窗口外壳；写 SEO 头、sitemap.xml 和 robots.txt；给 CSS/JS 引用打上 `?v=` 指纹；把 data/i18n.json 重新生成进 js/i18n.js。

产物是 20 个文件：18 个 HTML，加 sitemap.xml 和 robots.txt。`--check` 只校验不写文件，输出是「校验通过，20 个产物均为最新」。

第六件值得多说一句。指纹不是对文件本身算哈希，而是把它 import 的模块的哈希也算进去：build.py 里的 content_hash() 顺手把依赖方的哈希折进来，改一个模块，引用它的模块和页面指纹全变，老访客就不会卡在旧副本上。这段逻辑不长，但它是「改了代码，页面一定跟着变」这件事的保证。

## 页面是怎么长出来的

模板只有三个：layouts/base.html 是外壳，layouts/post.html 是文章壳，pages/detail.html 是项目页壳；要人改的是 pages/ 下的五个片段。数据在 data/ 里：projects.json 九条（七个项目加「文字」和 Soul for U 两个节点），posts.json 七篇，now.json 一条，i18n.json 每种语言 91 个键。

组装就是字符串替换：模板里写 `{{iconGrid}}`、`{{postBody}}` 这种占位符，build_page() 拿键名去 values 里查。替换只扫模板一趟，插进去的值不再被扫第二遍——这条是踩过坑才加的：文章正文里若照抄 `{{iconGrid}}` 这样的字面量，多趟替换会把它换成真的图标网格，整篇文章当页都没了。现在页面片段先解一遍再塞进外壳，叶子内容不会被当成占位符。

内容和样式因此分开了：内容在 data/ 和 blog/，样式在 css/，产物 HTML 一个字都不手改。`--check` 在产物和源码对不上时直接失败，.github/workflows/build-check.yml 在每次 push 和 pull request 上跑它。测试也轻：Python 76 个（63 测 build.py 的规则，13 测 markdown.py），Node 8 个，node --test 跑 js/nodes.js 这个纯函数。

## 手写一个 Markdown 子集，代价是什么

正文是 Markdown，但这个站不引入任何 Markdown 库。tools/markdown.py 是手写的小渲染器，docstring 里写着为什么不用 marked：

> 为什么不用浏览器那套 marked：marked 是 ES module，构建期要跑就得让 Python 构建依赖 Node。文章正文是作者手写的固定内容，一份够用的子集就够，还能省掉 marked 那份 vendor 拷贝。

它支持标题、段落、列表、围栏代码块、引用、分隔线、粗体、斜体、行内代码、链接。不支持表格、图片、嵌套列表、任务列表、脚注、HTML 块。

不支持的部分得老实说。docstring 里那句「宁可看得见，也别静悄悄渲染错」是认真的：表格这种语法我一篇都没写过，真写上去只会渲染成一行普通文本。补表格就是 render() 里加一个块级分支，我没补。

## 图标是像素画，XP 外壳是手写的

这个站没有图标字体，也没有图片图标资源。每个图标都是 tools/xp_icons.py 里手写的一串矩形：

```python
    # 月亮（写给一个人的那个页面）
    "moon": [
        (3, 3, 9, 9, "#ffe9b0"),
        (7, 3, 7, 9, "#2a5fb0"),
        (12, 2, 2, 2, "#fff6d8"),
        (2, 11, 2, 2, "#fff6d8"),
    ],
```

构建期转成内联 SVG，viewBox 固定 16×16，加 `shape-rendering="crispEdges"`，放大到 48px 边缘仍是硬像素。禁 JavaScript 也有图标，因为它是构建期写进 HTML 的。画斜线要用一串方块拼，文件顶上的 diag() 帮手干这件事。

js/xp.js 一千行出头，是最长的一个文件：IE 窗口可拖动、置前、最小化、最大化、关闭，自己维护前进后退栈；菜单栏六项，下拉里 19 条命令每条都有真实行为；一个通用弹窗壳用在关于本站、页面属性、快捷键、关机确认、注销确认五处，外加关机屏和登录屏两块整屏；任务栏有开始按钮、快速启动和托盘时钟。

图纸是桌面之上的一个全屏应用，也是全站唯一一处运行时取数据的地方：它拉 data/projects.json 和 data/posts.json，交给 js/nodes.js 的 buildNodes() 合成 16 个节点，js/map.js 把清单画成一张图纸——宽屏两栏，窄于 760 像素并成一栏。

## 两种语言活在同一份 HTML 里

中英不是两套页面，是同一份 HTML 里的两段。构建期 pair() 把一段文案写成两个 span，css/base.css 用 html[lang] 决定露哪一份，js/i18n.js 的 apply() 只改 html.lang 这一个属性。

后果有三条。没有运行时文案包要拉，也不用管相对路径在不同层级的页面里怎么拼；搜索引擎从同一个 URL 读到两种语言，不用伪造 hreflang；页面在 JavaScript 关掉时照样读得通——两种文字本来就在 HTML 里。

文章正文是同一套：post.md 是中文，post.en.md 是英文，构建期渲染成两段并排写进同一页。中文标题还要和数据表对账，test_build.py 里有一条测试逐篇比较两边的 title。

## 关掉 JavaScript 之后还剩什么

先说还剩什么。每一页的正文都在 HTML 里。首页还有一份 sr-only 清单，七个项目和七篇文章的标题、摘要，两种语言全在。文章正文是构建期渲染好的静态 HTML，不是运行时 fetch 的，关掉 JavaScript 照样能从头读到尾。桌面图标是真链接，测试里有一条专门盯着这件事。

再说没了什么。XP 外壳整个是脚本驱动的：窗口拖动、菜单下拉、对话框、任务栏、开始菜单、地址栏、图纸，没脚本就不存在。正文还读得到，但那个 XP 桌面不见了，剩下只是一张纸。图纸彻底不能用——它是唯一的运行时 fetch，入口那个快捷方式的 href 只是 #map，打开动作在 js/xp.js 里。文章里的 mermaid 图也一样：源码渲染成代码块，图要等脚本加载才画得出来。

mermaid 是这个站唯一的外部依赖，就一份，vendored 在 js/vendor/mermaid/ 下面，六十四个文件、两兆四。放本地而不是走 CDN，是因为其它一切都自己扛着：CDN 挂掉，图纸之外的东西还是好的。

## 下一步我会改哪里

三件事。第一，图纸那一份 JSON 是全站唯一的运行时 fetch：要么把它也烘焙进 HTML，要么承认这是有意的例外，在 README 里写清楚并加一条测试盯着它——它现在藏在 js/xp.js 里，下一个改站的人未必知道。第二，Markdown 子集不支持表格和嵌套列表，这个取舍只写在模块 docstring 里，README 的「写一篇新文章」那一节得写清楚别用。第三，这个仓库还没有 LICENSE 文件：七个项目页各自链出了各自仓库的协议，站本身这份代码该按什么协议发布，得定下来。

仓库在 [LinuxLinking/linuxlinking.github.io](https://github.com/LinuxLinking/linuxlinking.github.io)，构建命令是 `python tools/build.py`，校验命令是 `python tools/build.py --check`。改内容就改 data/ 和 blog/，别手改产物 HTML。
