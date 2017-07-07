import { registerOption } from 'pretty-text/pretty-text';
import { inlineRegexRule } from 'pretty-text/engines/markdown-it/helpers';

registerOption((siteSettings, opts) => {
  opts.features['checklist'] = !!siteSettings.checklist_enabled;
});

function applyStrikethrough(matches, state) {
  let token;

  if (matches) {
    token = state.push('strike_open', 's', 1);
    token.block = false;

    token = state.push('text', '', 0);
    token.content = matches[1];

    state.push('strike_close', 's', -1);
  }

  return true;
}

function applyCheckbox(matches, state) {
  let token;

  if (matches) {
    token = state.push('span_open', 'span', 1);

    let checklistClass = 'chcklst-box';
    if (matches[1].trim().length === 0)
      checklistClass += ' fa fa-square-o';
    else if (matches[1] === '_')
      checklistClass += ' fa fa-square';
    else if (matches[1] === '-')
      checklistClass += ' fa fa-minus-square-o';
    else if (matches[1].toLowerCase() === 'x')
      checklistClass += ' checked fa fa-check-square';
    else if (matches[1] === '*')
      checklistClass += ' checked fa fa-check-square-o';

    token.attrs = [['class', checklistClass]];
    token.block = false;

    state.push('span_close', 'span', -1);
  }

  return true;
}

export function setup(helper) {
  helper.whiteList([ 's',
                     'span.chcklst-box fa fa-square-o',
                     'span.chcklst-box fa fa-square',
                     'span.chcklst-box fa fa-minus-square-o',
                     'span.chcklst-box checked fa fa-check-square',
                     'span.chcklst-box checked fa fa-check-square-o' ]);

  if (helper.markdownIt)
  {
    helper.registerPlugin(md => {
      const ruler = md.inline.ruler;
      ruler.push('checklist-strikethrough', inlineRegexRule(md, {
        start: '--',
        matcher: /--(.*)--/i,
        emitter: applyStrikethrough
      }));

      ruler.push('checklist-empty-checkbox', inlineRegexRule(md, {
        start: '[',
        matcher: /\[([\s_\-x\*]{0,1})\]/i,
        emitter: applyCheckbox
      }));
    });
  }
  else {
    helper.inlineBetween({
      between: "--",
      emitter: function(contents) {
        return ["span", {"class": "chcklst-stroked"}].concat(contents);
      }
    });
    helper.addPreProcessor(replaceChecklist);
  }
}

function replaceChecklist(text) {
  text = text || "";
  text = text.replace(/\[\s?\]/ig, '<span class="chcklst-box fa fa-square-o"></span>');
  text = text.replace(/\[_\]/ig, '<span class="chcklst-box fa fa-square"></span>');
  text = text.replace(/\[-\]/ig, '<span class="chcklst-box fa fa-minus-square-o"></span>');
  text = text.replace(/\[x\]/ig, '<span class="chcklst-box checked fa fa-check-square"></span>');
  text = text.replace(/\[\*\]/ig, '<span class="chcklst-box checked fa fa-check-square-o"></span>');
  text = text.replace(/!<span class="chcklst-box (checked )?(fa fa-(square-o|square|minus-square-o|check-square|check-square-o))"><\/span>\(/ig, "![](");
  return text;
}
