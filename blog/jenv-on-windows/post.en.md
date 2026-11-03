---
title: A java.bat on PATH: A JDK Switcher Written in Pure Batch
date: 2026-11-02
tag: JENV FOR WINDOWS
lede: A java.bat shim sits in front of java on PATH and forwards it to the JDK you selected, JAVA_HOME always points at the JEnv directory instead of a real JDK, and an MCP server that never writes the registry lets an agent ask the same question.
---

## JAVA_HOME holds one value

Two projects, two JDKs, one machine. `jenv change` made A build; the next change left IDEA on the old value while Gradle said `JAVA_HOME is not set`.

Tools read `%JAVA_HOME%\bin\java.exe`. Once a real JDK path sits there, tools that look for java that way step over the switching layer, so switching must happen at call time.

## One java.bat shim is enough

The forwarding goes on `PATH`: the JEnv directory holds a `java.bat` and the installer prepends it, so `java` hits the shim. Its core:

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

The shim asks one command. `jenv getjava` prints one line, the shim appends `\bin\java.exe` and forwards, arguments passed through as `%*`. `javac.bat` is the same logic with `javac.exe`. Nothing resolved means no guessing: a missing path prints `There was an error:`, no default tells you to run `jenv change`.

## JAVA_HOME never points at a real JDK

The invariant: **JAVA_HOME always points at the JEnv directory itself, at user scope and at system scope, and a real JDK path is never written into it.**

The cost: the JEnv directory holds a `java.bat`, not `java.exe`, so some tools cannot resolve it; `jenv_run` injects a real `JAVA_HOME` into one child process for a build tool that needs one.

`jenv change <name>` asserts `JAVA_HOME` equals the JEnv directory at both scopes; `jenv use <name>` touches the session only. `jenv uninstall <name>` deletes the JEnv directory, so it hands a real JDK back to `JAVA_HOME` first.

## Three plain-text registry files

They live under `%APPDATA%\JEnv`; `JENV_APPDATA` overrides that, keeping the tests out of the real one:

- `jenvs.txt` — registered JDKs, one `name=path` per line
- `locals.txt` — directory bindings, one `name=dir` per line
- `global.txt` — the global default, one bare JDK path

No JSON, just `key=value`, parsed by cmd's `for /f "usebackq tokens=1,* delims=="`: the name is before the first `=`, the path after, and the last definition wins.

`jenv` has eleven sub-commands: `list`, `add`, `remove`, `change`, `use`, `local`, `getjava`, `link`, `uninstall`, `install`, `autoscan`.

`jenv use <name>` owns the current shell: the real JDK path goes into `JENVUSE`, the session `JAVA_HOME` becomes the JEnv directory, registry untouched; `jenv use remove` drops it. `jenv local <name>` owns the current directory: it appends `name=%CD%` to `locals.txt`, and `jenv local remove` deletes it.

Resolution order:

1. `JENVUSE` — a literal path, not a name
2. `locals.txt` — a binding whose directory *exactly* equals the working directory, with no inheritance into subfolders
3. `global.txt` — the global default

The second tier matches the exact directory only: a `jenv local` in a parent directory does not reach its children. The README says so, but the inherited help text still claims it applies to all subfolders. That line is wrong, and I have left it in place as a reminder of how fragile this layer is.

## How a JDK gets in

`jenv add <name> <path>` refuses names containing a space or any of `= & | < > ! ;`, refuses `remove` itself, and a path without `bin\java.exe`. It reads `jenvs.txt` back and compares name and value, erroring if they differ.

`jenv autoscan [--yes] [path]` scans for `java.exe`, accepts only the ones directly in a `bin` folder, derives a major version from the `release` file, and asks whether to add, skip or rename it. With no path it probes the drive letters from C to Z. The name comes from the release file, so no process is started: it used to run `java -version` and cut the string out of it, but that output carries quotes and parentheses that cmd cannot handle inside a block, so every scan came back named `java` and every one was rejected as a duplicate.

`jenv install` is not a downloader but the one-time setup: create the registry directory, point `JAVA_HOME` at the JEnv directory, prepend it to `PATH`; the system scope needs admin rights. `jenv link <exe>` writes a shim of the same shape, `jenv remove <name>` deletes a name from both registry files.

## An MCP server that never writes the registry

AI agents do not work the way the shim assumes: they write absolute paths, or "helpfully" edit `PATH` and `JAVA_HOME` to make a build succeed, wrecking the user's JDK choice.

So I gave it an MCP server (`mcp/server.js`, Node.js, standard library only, MCP over stdio): `jenv_list` lists the registry, `jenv_current` answers which JDK applies to a directory and why, returning the trace of every tier checked; `jenv_run` runs one command with the selected JDK.

The first two are read-only. `jenv_run` starts a process, so it touches one child: `JAVA_HOME` and `JENVUSE` are set for it and `<JAVA_HOME>\bin` goes first on its `PATH`. The server's own environment stays untouched.

Staying read-only with respect to the machine is deliberate: it never writes the registry, never creates `%APPDATA%\JEnv`, never invokes a `jenv` sub-command, so `jenv use` and `jenv change` are out of reach. `JENV_MCP_DISABLE_RUN=1` removes `jenv_run`.

## What the tests cover

`tests/run-all.ps1` runs the other two and reports failures.

- `tests/run-cli.ps1` is the CLI suite: a throwaway registry and two fake JDKs in `%TEMP%`, the real registry, `JAVA_HOME` and `PATH` untouched. It covers rejected names and paths, and the resolution of `change`, `use` and `local`.
- `tests/run-mcp.ps1` is the MCP suite: it starts `node mcp\server.js`, speaks JSON-RPC to it, and asserts `initialize` succeeds and `jenv_list` reports `jdk21` with version `21.0.8`. Its `jenv_run` case proves the most: it runs the system's own `cmd` with `echo %JAVA_HOME%` and checks the child got the injected `JAVA_HOME`.

The `use` and `local` assertions must run inside one cmd session: they propagate `JENVUSE` and `JAVA_HOME` to the caller through `endlocal & set`.

## What I would change next

First, `jenv local` does not inherit into subfolders, the sharpest seam in the project; the only workaround is to cd in and run it again. I want an explicit "recurse" switch, but it raises the harder question of what a child's binding does when the parent changes.

Second, `jenv-config.bat` is a set of subroutines called as `call jenv-config.bat :func` (`:find_path`, `:find_local_name`, `:remove_by_key`, `:major_version`), which `jenv.bat` does not dispatch. I would split it into a registry file and a version file.

The repository is [LinuxLinking/windows-jenv-mcp](https://github.com/LinuxLinking/windows-jenv-mcp), Apache-2.0 licensed; its `NOTICE` records it as a derivative work of Felix Selter's JEnv-for-Windows, rewritten in cmd.
