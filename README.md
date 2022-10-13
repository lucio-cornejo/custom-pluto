# custom-pluto
Customize Julia's Pluto notebook's stlye and keyboard shortcuts.

## Motivation 

<https://github.com/fonsp/Pluto.jl/issues/65#issue-595782206>

## Implementation

- **Toggle light/dark mode**: \
  Added a button in Pluto notebook page.

- **Wrap in `begin ... end`**: TBD \
  Implemented shortcut: `Ctrl+Alt+B`

- **Wrap in `let ... end`**: TBD \
  Implemented shortcut: `Ctrl+Alt+L`

- **Wrap in `md""" ... """`** \
  Implemented shortcut: `Ctrl+Alt+M`

- **Toggle cell's input visibilty**: \
  Implemented shortcut: `Alt+C`  (Non VS Code)

- **Toggle live documentation**: \
  Implemented shortcut: `Ctrl+Alt+D`  (Non VS Code?)

- **Split cell**: \
  Implemented shortcut: `Ctrl+Alt+S`  (Non VS Code?)

- **Add cell above**: \
  Implemented shortcut: `Ctrl+Shift+Enter`  (VS Code)

- **Add cell without running**: \
  Implemented shortcut: `Alt+Enter`  (Non VS Code)

- **Move cell(s) up/down**: `Ctrl+Up` and `Ctrl+Down` \
  Suggested shortcut: `Alt+PageUp` and `Alt+PageDown`

  The following code seemed promising, but failed.
  Code cell swaping occurs, but after interacting
  with the notebook, the cells are 
  ```js
  // Alt+PageUp
  const cellCode = getPlutoCell(getSelection().anchorNode)
  cellCode.previousElementSibling.before(cellCode)
  // Alt+PageDown
  const cellCode = getPlutoCell(getSelection().anchorNode)
  cellCode.nextElementSibling.after(cellCode)

  function getPlutoCell(el) {
    try {
      if (el.tagName !== "PLUTO-CELL") {
        return getPlutoCell(el.parentElement);
      }
      return el;
    } catch (e) { }
  }
  ```

## Recommendation

- The code which enables this Pluto customization
is inserted into the Pluto notebook via
[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en).

- You can set custom keyboard shortcuts using the
following JavaScript function:
  ```js
  keysAction(
    initialKeys,  // Array of key.code values
    lastKey,      // key.code value
    eventKey,     // event.key
    firstLine,    // Custom String
    lastLine      // Custom String
  )
  ```

  For example:
  ```js
  /*
    Insert "begin ... end" code in Pluto cell
    Keyboard shortcut: Ctrl+Alt+B
  */
  keysAction(["Control", "Alt"], "b", evt.key, "begin", "end");
  ```

  Such code must be inserted in the appropriate context ...
  a complete example can be found 
  [here](https://github.com/lucio-cornejo/custom-pluto/blob/main/custom-Pluto.js#L216).

- Due to the tedious process of mapping custom keyboard
shortcuts (from VS Code, Atom, Vim or whatever) to Pluto,
a partial solution may be to run Pluto via:

  ```julia
  import Pluto
  Pluto.run(auto_reload_from_file=true)
  ```

  This way, changes in the `.jl` file associated to the
  Pluto notebook will be applied to the notebook itself.

  Therefore, custom keyboard shortcuts can be used via
  opening the `.jl` file in some prefered editor,
  and the notebook will be updated accordingly.
