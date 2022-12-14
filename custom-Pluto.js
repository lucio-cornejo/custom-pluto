// ==UserScript==
// @name         Custom Pluto
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Customize your Pluto notebook
// @author       Lucio Cornejo
// @match        *localhost:1234/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  // Apply customization to notebook
  if (!document.querySelector("pluto-notebook")) return;

  /*
    Custom styling
  */
  // Variable for light(0)/dark(1) theme toggle
  document.documentElement.style.cssText = "--theme: 1";

  const customStyle = document.createElement("style")

  customStyle.innerHTML =
    /*
      Dark mode
    */
    "html {filter: invert(var(--theme)); }\n" +
    // Do not alter to dark mode
    `input, img,
    pluto-logs-container,
    .plot-container, .plotly {
      filter: invert(var(--theme));
    }\n` +
    // Set tab size to 2
    ".cm-content { tab-size: 2 !important; }\n" +
    /*
      Style table of contents
    */
    // Fix padding issue in table of contents
    `a.H3 { padding-left: 20px !important; }
    /* .plutoui-toc.aside { left: 0; width: 10rem !important; } */ \n` +

    /*
      Other changes
    */
    // Center content of notebook
    "/* main { align-self: unset !important; } */ \n" +
    // Add left space for better cell drag icon visibility
    "main { margin-left: 20px !important; }\n" +

    /*
      Style terminal output
    */
    `pluto-log-dot-sizer { width: 75vw; }
    pluto-log-dot {
      width: 100%;
      padding: 0.5rem;
      line-height: 1.5rem;
      background: black !important;
    }
    pluto-logs-container {
      background-color: black !important;
    }`;

  document.head.appendChild(customStyle);

  /*
    Add button to toggle light and dark mode
  */
  const toggleExport = document.querySelector("#at_the_top .toggle_export");
  const toggleTheme = document.createElement("button");

  toggleTheme.innerText = "Toggle light/dark mode";
  toggleTheme.style.cssText = `
    color: crimson;
    cursor: pointer;
    margin-right: 2rem;
    border-radius: 50px;
    padding: 0.3rem 0.55rem;
    background-color: white;
    filter: drop-shadow(0 0 0.25rem var(--ui-button-color));
  `
  toggleTheme.onclick = function () {
    document.documentElement.style.setProperty(
      "--theme",
      String((parseInt(
        document.documentElement.style
          .getPropertyValue("--theme")
      ) + 1) % 2
    ))
  }

  toggleExport.before(toggleTheme);

  /*
    Obtain pluto-cell HTML element
  */
  function getPlutoCell(el) {
    try {
      if (el.tagName !== "PLUTO-CELL") {
        return getPlutoCell(el.parentElement);
      }
      return el;
    } catch (e) { }
  }

  /*
    Create two lines of code,
    for first and last line, respectively,
    of Pluto code cell.
  */
  function insertCode(textStart, textEnd) {
    const divStart = document.createElement("div");
    divStart.classList.add("cm-line");
    const spanStart = document.createElement("span");
    spanStart.classList.add("??x");
    spanStart.innerText = textStart;
    divStart.appendChild(spanStart);

    const divEnd = document.createElement("div");
    divEnd.classList.add("cm-line");
    const spanEnd = document.createElement("span");
    spanEnd.classList.add("??x");
    spanEnd.innerText = textEnd;
    divEnd.appendChild(spanEnd);

    return [divStart, divEnd];
  }

  /* 
    Extract raw code from Pluto cell
  */
  function extractCellCode(plutoCell) {
    const linesContainer = Array.from(
      plutoCell.querySelector("[role='textbox']")
        .children
    );
    
    let codeText = "";
    linesContainer.forEach(lineContainer => {
      lineContainer.childNodes.forEach(line => {
        codeText += extractLineText(line);
      });
      codeText += "\n";
    });
    
    codeText = codeText.split("\n");
    codeText.pop();
    return codeText;
    
    /*
    // Check that code text extraction is correct
    linesContainer[0].parentElement.innerHTML = codeText
      .map(line => `<div><span>${line}</span></div>`)
      .join('');
    */
  }

  function extractLineText(line) {
    if (line.nodeName === "#text") return line.nodeValue;
    
    if (line.nodeName === "SPAN") {
      // Case like <span><span>text</span></span> .
      // Such HTML structure is sometimes triggered 
      // automatically by Pluto for first and last cell lines.
      if (line.classList.contains("cm-matchingBracket")) {
        return extractLineText(line.firstChild);
      }
  
      // Case where span elements are used to contain
      // information about the code line, not the text itself.
      if (line.childElementCount) return ""; 
      
      // Usual case: <span>text</span>
      return line.innerText;
    }
  
    // Case where the code text is inside a span element
    // contained in a <pluto-variable-link> element.
    if (line.nodeName === 'PLUTO-VARIABLE-LINK') {
      return extractLineText(line.firstChild);
    }
    
    return "";
  }

  /*
    When some keyboard two-keys combination is pressed.
    toggle insertion of two lines of code
    into selected Pluto code cell.
  */
  function keysAction(initialKeys, lastKey, eventKey, firstLine, lastLine) {
    // Check that every key in initialKeys is currently pressed
    const areAllPressed = initialKeys.every(
      (key) => keyPress[key] === true
    );

    if (areAllPressed && lastKey === eventKey) {
      const cellCode = getPlutoCell(getSelection().anchorNode)
        .querySelector("div[role='textbox'].cm-content");

      /* Create HTML for two new code lines */
      const [beginDiv, endDiv] = insertCode(firstLine, lastLine);

      /*
        Check if the two new lines' code is already
        present in the current cell,
        and remove them, if that's the case.
      */
      let currentFirstLine = "";
      // Read text from each node in current cell's
      // first line. Sometimes the code is not inserted
      // into span elements, but as #text.
      cellCode.firstElementChild.childNodes.forEach(
        line => {
          if (line.nodeName === "#text") {
            currentFirstLine += line.nodeValue;
          } else {
            // We assume the line is an HTML element
            currentFirstLine += line.innerText;
          }
      });

      if (firstLine === currentFirstLine) {
        cellCode.firstElementChild.remove()
      } else {
        cellCode.firstElementChild.before(beginDiv);
      }

      let currentLastLine = "";
      cellCode.lastElementChild.childNodes.forEach(
        line => {
          if (line.nodeName === "#text") {
            currentLastLine += line.nodeValue;
          } else {
            // We assume the line is an HTML element
            currentLastLine += line.innerText;
          }
      });

      if (lastLine === currentLastLine) {
        cellCode.lastElementChild.remove();
      } else {
        cellCode.appendChild(endDiv);
      }

      // Reset object
      keyPress = {}; return;
    }
  }

  /*
    Multiple key presses
  */
  window["keyPress"] = {};

  /*
    When changing windows, sometimes
    the keyup event is not registered
    in the browser tab for Pluto.
  */
  window["lostKeyUp"] = 0;

  document.addEventListener("keyup", function(evt) {
    lostKeyUp = (lostKeyUp + 1)%2;
    // delete keyPress[evt.key]
    keyPress = {}; return;
  });

  document.addEventListener("keydown", function (evt) {
    // Avoid keydown event repetition due to holding key
    if (evt.repeat) return;
    lostKeyUp = (lostKeyUp + 1)%2;

    // Case where there was a window change
    // and at least some keyup event did not
    // get registered in Pluto browser tab.
    if (!lostKeyUp) {
      // window["keyPress"] = {};
      // window["lostKeyUp"] = false;
    }

    keyPress[evt.key] = true;

    /*
      Insert "begin ... end" code in Pluto cell
      Keyboard shortcut: Ctrl+Alt+B
    */
    keysAction(["Control", "Alt"], "b", evt.key, "begin", "end");

    /*
      Insert "let ... end" code in Pluto cell
      Keyboard shortcut: Ctrl+Alt+L
    */
    keysAction(["Control", "Alt"], "l", evt.key, "let", "end");

    /*
      Insert "with_terminal() do ... end" code in Pluto cell
      Keyboard shortcut: Ctrl+Alt+T
    */
    keysAction(["Control", "Alt"], "t", evt.key, "with_terminal() do", "end");

    /*
      Insert 'md""" ... """' code in Pluto cell
      Keyboard shortcut: Ctrl+Alt+M
    */
    keysAction(["Control", "Alt"], "m", evt.key, "md\"\"\"", "\"\"\"");

    /*
      Toggle visibility of markdown cells' code: Alt+m
    */
    if (keyPress["Alt"] && "m" === evt.key) {
      document.querySelectorAll(
        "pluto-cell:has(pluto-output .markdown)"
      ).forEach(cell => {
        // Even if the Pluto cell has no class,
        // or has only the classes
        // "show_input" and "code_folded", the
        // following code will toggle the
        // visibility of the markdown cell's code.
        cell.classList.toggle("show_input");
        cell.classList.toggle("code_folded");
        });
    }

    /*
      Toggle code cell visibility: Alt+c
    */
    if (keyPress["Alt"] && "c" === evt.key) {
      getPlutoCell(getSelection().anchorNode)
        .querySelector("button.foldcode").click();

      // Reset object
      keyPress = {}; return;
    }

    /*
      Add cell before: Control+Shift+Enter
    */
    if (keyPress["Control"] && keyPress["Shift"] && "Enter" === evt.key) {
      getPlutoCell(getSelection().anchorNode).querySelector("button.add_cell.before").click();

      // Reset object
      keyPress = {}; return;
    }

    /*
      Add cell after: Alt+Enter
    */
    if (keyPress["Alt"] && "Enter" === evt.key) {
      getPlutoCell(getSelection().anchorNode).querySelector("button.add_cell.after").click();

      // Reset object
      keyPress = {}; return;
    }

    /*
      Toggle live documentation: Control+Alt+d
    */
    if (keyPress["Control"] && keyPress["Alt"] && "d" === evt.key) {
      if (document.querySelector("pluto-helpbox header input")) {
        document.querySelector("pluto-helpbox").classList.toggle("hidden");
        document.querySelector("pluto-helpbox button").click();
      } else {
        document.querySelector("pluto-helpbox").classList.toggle("hidden");
        document.querySelector("pluto-helpbox header").click();
      }
    }

    /*
      Split cell: Control+Alt+s
    */
    if (keyPress["Control"] && keyPress["Alt"] && "s" === evt.key) {
      (async function () {
        // Get code line where mouse is located
        let oldLine = getSelection().anchorNode;
        while (!oldLine.classList) { oldLine = oldLine.parentElement }
        while (!oldLine.classList.contains("cm-line")) {
          oldLine = oldLine.parentElement
        }
      
        // Extract code text from selected line
        let oldLineCode = "";
        oldLine.childNodes.forEach(node => {
          oldLineCode += extractLineText(node);
        });
      
        oldLineCode;
      
        // Extract code text from selected cell
        const oldCell = getPlutoCell(getSelection().anchorNode);
        let oldCellCode = extractCellCode(oldCell);
      
        // Split code text based on selected line
        const lineIndex = oldCellCode.indexOf(oldLineCode);
        const newCellCode = oldCellCode.slice(lineIndex);
        oldCellCode = oldCellCode.slice(0, lineIndex);
      
        /*
          Due to Pluto only allowing one line per cell, 
          unless something like "begin ... end" is used,
          and the fact that splitting a one line cell does
          not make much sense, we will replicate the first
          and last line of the old cell, into the new one.
        */
        oldCellCode.push(newCellCode.at(-1));
        newCellCode.unshift(oldCellCode[0]);
      
        // Create new cell
        oldCell.querySelector("button.add_cell.after").click();
      
        await new Promise(r => setTimeout(r, 500));
        const newCell = oldCell.nextElementSibling;
      
        // Update code in cells
        oldCell.querySelector('[role="textbox"]').innerHTML = 
          oldCellCode.map(line => `<div><span>${line}</span></div>`)
            .join('');
            
        newCell.querySelector('[role="textbox"]').innerHTML = 
          newCellCode.map(line => `<div><span>${line}</span></div>`)
            .join('');
        
        return ;
    })()
    }
  });
})();