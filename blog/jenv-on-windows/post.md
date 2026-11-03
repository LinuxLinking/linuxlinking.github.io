---
title: 在 PATH 上放一个 java.bat：我用纯批处理写了个 JDK 切换器
date: 2026-11-02
tag: JENV FOR WINDOWS
lede: 一个 java.bat 垫片挡在 PATH 前面转发到选中的 JDK，JAVA_HOME 恒指向 JEnv 目录，附带一个不写注册表的 MCP server。
---

## JAVA_HOME 只能有一个值，这是设计的起点

两个项目、两套 JDK，逼出架构的是一次翻车：项目 A 要 JDK 17，项目 B 要 JDK 21——`jenv change` 指过去编译过了，切到 B 再改一次，IDEA 还拿着旧值，Gradle 报 `JAVA_HOME is not set`。

定架构的是另一件事：工具读 `%JAVA_HOME%\bin\java.exe`。`JAVA_HOME` 里只要放得下真实 JDK 路径，找 java 的工具就会绕过切换层，用回旧 JDK。切换必须发生在调用那一刻。

## 一个 java.bat 垫片就够了

转发放在 `PATH` 上：JEnv 目录里放一个 `java.bat`，安装时把该目录 prepend 到 `PATH` 最前面，`java` 命中它而不是真的 `java.exe`。核心摘自 `java.bat`：

```bat
set "JENV_BAT=%~dp0jenv.bat"
set "var="
for /f "usebackq delims=" %%i in (`call "%JENV_BAT%" getjava`) do set "var=%%i"

if exist "%var%\bin\java.exe" (
    "%var%\bin\java.exe" %*
) else (
    echo There was an error:
    echo %var%
)
```

垫子只问一个命令。`jenv getjava` 打印一行路径，垫子接住，拼出 `\bin\java.exe` 转发过去，参数 `%*` 原样带走；`javac.bat` 同一段逻辑，只换 `javac.exe`。没有解析出 JDK 时它不猜：路径不存在就打印 `There was an error:`，什么都没解析出来时 `jenv getjava` 提示用 `jenv change` 设默认。

## JAVA_HOME 永远不指向真实 JDK

这是整个项目唯一的不变量：**`JAVA_HOME` 永远指向 JEnv 目录本身，用户级和系统级都是；真实 JDK 路径永远不写进 `JAVA_HOME`。**

Gradle、IDEA 按 `%JAVA_HOME%\bin\java.exe` 找 java，只要 `JAVA_HOME` 指着真实 JDK，`jenv use` 和 `jenv local` 的选择就到不了它们面前。

代价我认了：JEnv 目录里放的是 `java.bat` 不是 `java.exe`，有工具因此解析不出。这类工具用 `PATH` 上的 `java`；需要真实 `JAVA_HOME` 的构建工具由 `jenv_run` 在单个子进程里注入。

`jenv change <name>` 在两个作用域上都断言 `JAVA_HOME` 等于 JEnv 目录，`jenv use <name>` 只改会话。例外是 `jenv uninstall <name>`：走之前把一个真实 JDK 还给 `JAVA_HOME`。

## 三份纯文本注册表，use 和 local 各管一层

注册表是 `%APPDATA%\JEnv` 下的三个纯文本文件（`JENV_APPDATA` 可改位置）：

- `jenvs.txt` 记已注册的 JDK，每行 `name=path`
- `locals.txt` 记目录绑定，每行 `name=dir`
- `global.txt` 记全局默认，一行裸路径

没有 JSON，就是 `key=value`，解析用 cmd 的 `for /f "usebackq tokens=1,* delims=="`：第一个 `=` 之前是名字，之后是路径；空行和 `;` 开头的行跳过，同名后写赢。

`jenv` 有十一个子命令：`list`、`add`、`remove`、`change`、`use`、`local`、`getjava`、`link`、`uninstall`、`install`、`autoscan`。

- `jenv use <name>` 只管**当前这个 shell**：真实 JDK 路径写进 `JENVUSE`，会话 `JAVA_HOME` 设成 JEnv 目录，不写注册表；`jenv use remove` 撤销覆盖。
- `jenv local <name>` 只管**当前这个目录**：往 `locals.txt` 追加一行 `name=%CD%`，`jenv local remove` 删掉当前目录那行。

1. `JENVUSE` —— 字面路径
2. `locals.txt` —— 目录**完全相等**的绑定
3. `global.txt` —— 全局默认

第二层只认完全相等：父目录的 `jenv local` 不影响子目录。README 写明了这一点，但继承来的帮助文本还写着「对所有子目录生效」——那一行是错的。我留着它没改，是提醒自己这层有多脆。

## JDK 怎么进来

`jenv add <name> <path>`：名字不能含空格和 `= & | < > ! ;`，也不能是 `remove`，路径必须有 `bin\java.exe`；写进 `jenvs.txt` 后它把文件读回来核对名字和值，对不上就报错。

`jenv autoscan [--yes] [path]`：扫描目录找 `java.exe`，只认直接躺在 `bin` 里的那些，从 `<jdk>\release` 里读 `JAVA_VERSION` 得出主版本号当默认名字，然后问你收不收、要不要改名。版本名从 `release` 文件推出，不起 `java` 进程。原来它跑 `java -version` 再截输出字符串，那行输出带引号和括号，cmd 在括号块里处理不了，于是每次扫出来的名字都是 `java`，每次都被当成重名拒绝。

`jenv install` 不是下载器，是一次性配置：建注册表目录、把 `JAVA_HOME` 设到 JEnv 目录、把 JEnv 目录 prepend 到 `PATH`；覆盖系统级要管理员权限。`jenv link <exe>` 生成的垫子，名字只允许字母、数字、`-` 和 `_`。`jenv remove <name>` 从两份注册表文件里抹掉它。

## 让 agent 来问：不写注册表的 MCP server

AI agent 不这么干：它写绝对路径，或者「顺手」改 `PATH` 和 `JAVA_HOME` 让构建通过，把我维护的 JDK 选择弄乱。

所以我给它配了一个 MCP server（`mcp/server.js`，Node.js，零依赖只用标准库，MCP over stdio 的 JSON-RPC 2.0）：`jenv_list` 列出注册表，`jenv_current` 回答某个目录现在用哪个 JDK，**以及为什么**，`jenv_run` 用选中的 JDK 跑一条命令。

前两个是只读的。第三个会起进程，所以它只给**那一个子进程**注入 `JAVA_HOME` 和 `JENVUSE`，把 `<JAVA_HOME>\bin` 插到子进程 `PATH` 前面；server 自己的环境不改。

只读是刻意的（只对机器而言）：它不写注册表、不创建 `%APPDATA%\JEnv`、不调用任何 `jenv` 子命令，连 `jenv use` 和 `jenv change` 都够不着。`JENV_MCP_DISABLE_RUN=1` 可把 `jenv_run` 摘掉。

## 三个测试脚本覆盖了什么

`tests/run-all.ps1` 把下面两个跑一遍，汇总成败。

- `tests/run-cli.ps1` 是命令行回归：它在 `%TEMP%` 里造一次性的注册表和两个假 JDK，用 `JENV_APPDATA` 指过去，真实机器的注册表、`JAVA_HOME`、`PATH` 一个都不碰；断言打的是输出文本而不是退出码：子命令出错时是打印一句然后返回 0。它覆盖重名、非法名字、坏路径被拒，以及 `change`、`use`、`local` 的结果。
- `tests/run-mcp.ps1` 是 MCP 回归：它把 `node mcp\server.js` 拉起来用 JSON-RPC 喂它，断言 `initialize` 成功、`jenv_list` 报出 `jdk21` 和版本 `21.0.8`。`jenv_run` 那条最实在：用系统的 `cmd` 跑 `echo %JAVA_HOME%`，断言子进程真收到了注入的 `JAVA_HOME`，不需要真 JDK 就能证明这条路是通了。

`use` 和 `local` 的断言必须跑在同一个 cmd 会话里：它们靠 `endlocal & set` 把 `JENVUSE` 和 `JAVA_HOME` 传回调用方的会话，跨进程看不见。

## 下一步我会改哪里

两件事。第一，`jenv local` 不继承子目录，是这个项目最尖的一处接缝，唯一的解药是「进目录再敲一次」。我想给它一个显式的「递归到子目录」开关，但开关会引出「父目录改了子目录的绑定怎么办」，先不动。

第二，`jenv-config.bat` 是一组 `call jenv-config.bat :func` 调用的子程序，`jenv.bat` 不分发它。我想拆成配置读写和版本推导两个文件。

仓库在 [LinuxLinking/windows-jenv-mcp](https://github.com/LinuxLinking/windows-jenv-mcp)，Apache-2.0 协议；`NOTICE` 说它是 Felix Selter 的 JEnv-for-Windows 的衍生作品，纯批处理重写。
