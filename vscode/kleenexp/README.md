# kleenexp

Enables the [Kleenexp](https://github.com/SonOfLilit/kleenexp) modern Regular Expression syntax for Search and Replace in Visual Studio Code.

## Syntax

### A Taste of the Syntax

| Legacy                                                                                                                                   | KleenExp                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Hello\. My name is Inigo Montoya\. You killed my Father\. Prepare to die\.`                                                             | `Hello. My name is Inigo Montoya. You killed my Father. Prepare to die.`                                                                                                               |
| `(What is your (?:name\|quest\|favourite colour)\?)\s?){1,3}`                                                                            | `[1-3 'What is your ' ['name' \| 'quest' \| 'favourite colour'] '?' [0-1 #space]]`                                                                                                     |
| `Hello\. My name is (?<name>[A-Z][a-z]+ [A-Z][a-z]+)\. You killed my (?:Father\|Mother\|Son\|Daughter\|Dog\|Hamster)\. Prepare to die\.` | `Hello. My name is [capture:name #tmp ' ' #tmp #tmp=[#uppercase [1+ #lowercase]]]. You killed my ['Father' \| 'Mother' \| 'Son' \| 'Daughter' \| 'Dog' \| 'Hamster']. Prepare to die.` |

Or, if you're in a hurry you can use the shortened form:

```
Hello. My name is [c:name #uc [1+ #lc] ' ' #uc [1+ #lc]]. You killed my ['Father' | 'Mother' | 'Son' | 'Daughter' | 'Dog' | 'Hamster']. Prepare to die.
```

Continue to our [full tutorial](https://github.com/SonOfLilit/kleenexp#tutorial).

## Features

By default, keybindings for Find, Find in Files, etc' are overriden by this extension, and show a popup menu where you can enter a KleenExp. Upon selecting a KleenExp, it will be compiled to legacy regex and the standard dialog will open with that regex:

![Demo](/vscode/kleenexp/kleenexp.gif)

> In the future we intend to integrate seamlessly with the vscode Find dialog. However, this will require some patches to vscode itself, since an API for this does not exist yet, so for the alpha version, there's an input popup. It has history with search-as-you-type and is quite ergonomic overall.

## Requirements

You must have the `kleenexp` python package installed:

```
$ pip install kleenexp
```

If it's installed in a non-standard location, you will need to configure the `kleenexp.kePath` setting.

## Known Issues

This is alpha-level software. There will be many issues. Please report them on our [github](https://github.com/SonOfLilit/kleenexp). That being said, it's already pretty awesome to work with.

## Release Notes

### 0.0.1

Initial release
