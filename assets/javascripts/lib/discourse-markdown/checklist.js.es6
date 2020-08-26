import { registerOption } from 'pretty-text/pretty-text';

registerOption((siteSettings, opts) => {
  opts.features['checklist'] = !!siteSettings.checklist_enabled;
});

const REGEX = /\[(\s?|_|-|x|\*)\]/ig;

function getClasses(str) {
  switch(str.toLowerCase()) {
    case "x":
      return "checked fa fa-check-square";
    case "*":
      return "checked fa fa-check-square-o";
    case "-":
      return "fa fa-minus-square-o";
    case "_":
      return "fa fa-square";
    default:
      return "fa fa-square-o";
  }
}

function addCheckbox(result, content, match, state) {
  let classes = getClasses(match[1]);
  let token = new state.Token('check_open', 'span', 1);
  token.attrs = [['class', `chcklst-box ${classes}`]];
  result.push(token);

  token = new state.Token('check_close', 'span', -1);
  result.push(token);
}

function applyCheckboxes(content, state) {

  let result = null,
      pos = 0,
      match;

  while (match = REGEX.exec(content)) {

    if (match.index > pos) {
      result = result || [];
      let token = new state.Token('text', '', 0);
      token.content = content.slice(pos, match.index);
      result.push(token);
    }

    pos = match.index + match[0].length;

    result = result || [];
    addCheckbox(result, content, match, state);
  }

  if (result && pos < content.length) {
    let token = new state.Token('text', '', 0);
    token.content = content.slice(pos);
    result.push(token);
  }

  return result;
}

function processChecklist(state) {
  var i, j, l, tokens, token,
      blockTokens = state.tokens,
      nesting = 0;

  for (j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== 'inline') { continue; }
    tokens = blockTokens[j].children;

    // We scan from the end, to keep position when new tags are added.
    // Use reversed logic in links start/end match
    for (i = tokens.length - 1; i >= 0; i--) {
      token = tokens[i];

      nesting += token.nesting;

      if (token.type === 'text' && nesting === 0) {
        let processed = applyCheckboxes(token.content, state);
        if (processed) {
          blockTokens[j].children = tokens = state.md.utils.arrayReplaceAt(tokens, i, processed);
        }
      }
    }
  }

}


function setupMarkdownIt(helper) {
  helper.registerOptions((opts, siteSettings)=>{
    opts.features['checklist'] = !!siteSettings.checklist_enabled;
  });

  helper.registerPlugin(md =>{
    md.core.ruler.push('checklist', processChecklist);
  });
}

export function setup(helper) {
  helper.whiteList([ 'span.chcklst-stroked',
                     'span.dropcaps',
                     'span.chcklst-box fa fa-square-o',
                     'span.chcklst-box fa fa-square',
                     'span.chcklst-box fa fa-minus-square-o',
                     'span.chcklst-box checked fa fa-check-square',
                     'span.chcklst-box checked fa fa-check-square-o' ]);

  setupMarkdownIt(helper);
}
