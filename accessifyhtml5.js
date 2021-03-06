/*!
 * Accessifyhtml5.js
 *
 * Source: https://github.com/yatil/accessifyhtml5.js
 */

window.AccessifyHTML5 = function (defaults, more_fixes) {
  'use strict';

  var fixes = {
    'article': { 'role': 'article' },
    'aside': { 'role': 'complementary' },
    'nav': { 'role': 'navigation' },
    'main': { 'role': 'main' },
    'output': { 'aria-live': 'polite' },
    'section': { 'role': 'region' },
    '[required]': { 'aria-required': 'true' }
  };
  var result = { ok: [], warn: [], fail: [] };
  var error = result.fail;
  var fix, elems, attr, value, key, obj, i, mo, by_match, el_label;
  // ( var fix, elems, attr, value, key, obj, i, mo, byMatch, elemLabel )
  var ATTR_SECURE = new RegExp('aria-[a-z]+|role|tabindex|title|alt|data-[\\w-]+|lang|' + 'id|' +
    'style|for|maxlength|placeholder|pattern|required|type|target|accesskey|longdesc');
  var ID_PREFIX = 'acfy-id-';
  var n_label = 0;
  var Doc = window.document;

  if (Doc.querySelectorAll) {
    if (defaults) {
      if (defaults.header) {
        fixes[defaults.header] = {
          'role': 'banner'
        };
      }
      if (defaults.footer) {
        fixes[defaults.footer] = {
          'role': 'contentinfo'
        };
      }
      if (defaults.main) {
        fixes[defaults.main] = {
          'role': 'main'
        };
        fixes.main = {
          'role': ''
        };
      }
    }

    // Either replace fixes...
    if (more_fixes && more_fixes._CONFIG_ &&
        more_fixes._CONFIG_.ignore_defaults) {
      fixes = more_fixes;
    } else {
      // ..Or concatenate - the default.
      for (mo in more_fixes) {
        fixes[ mo ] = more_fixes[ mo ];
      }
    }

    for (fix in fixes) {
      if (fix.match(/^_(CONFIG|[A-Z]+)_/)) {
        continue; // Silently ignore.
      }

      if (fixes.hasOwnProperty(fix)) {
        // Question: should we catch and report (or ignore) bad selector syntax?
        try {
          elems = Doc.querySelectorAll(fix);
        } catch (ex) {
          error.push({ sel: fix,
            attr: null,
            val: null,
            msg: 'Invalid syntax for `document.querySelectorAll` function',
            ex: ex });
        }
        obj = fixes[ fix ];

        if (!elems || elems.length < 1) {
          result.warn.push({ sel: fix, attr: null, val: null, msg: 'Not found' });
        }

        for (i = 0; i < elems.length; i++) {
          for (key in obj) {
            if (obj.hasOwnProperty(key)) {
              attr = key;
              value = obj[key];

              if (attr.match(/_?note/)) { // Ignore notes/comments.
                continue;
              }

              if (!attr.match(ATTR_SECURE)) {
                error.push({ sel: fix,
                  attr: attr,
                  val: null,
                  msg: 'Attribute not allowed',
                  re: ATTR_SECURE });
                continue;
              }
              if (!(typeof value).match(/string|number|boolean/)) {
                error.push({ sel: fix, attr: attr, val: value, msg: 'Value-type not allowed' });
                continue;
              }

              // Connect up 'aria-labelledby'.
              // Note: we no longer accept poor spelling.
              by_match = attr.match(/(for|aria-labelledby|aria-describedby)$/);
              if (by_match) {
                try {
                  el_label = Doc.querySelector(value); // Not: elems[i].querySel()
                } catch (ex) {
                  error.push({ sel: fix,
                    attr: attr,
                    val: value,
                    msg: "Invalid selector syntax (2) - see 'val'",
                    ex: ex });
                }

                if (!el_label) {
                  error.push({ sel: fix,
                    attr: attr,
                    val: value,
                    msg: "Labelledby ref not found - see 'val'" });
                  continue;
                }

                if (!el_label.id) {
                  el_label.id = ID_PREFIX + n_label;
                }

                value = el_label.id;
                // attr = by_match[1];

                n_label++;
              }

              if (!elems[i].hasAttribute(attr)) {
                elems[i].setAttribute(attr, value);

                result.ok.push({ sel: fix, attr: attr, val: value, msg: 'Added' });
              } else {
                result.warn.push({ sel: fix, attr: attr, val: value, msg: 'Already present, skipped' });
              }
            }
          }
        } // End: for (i..elems..i++)
      }
    } // End: for (fix in fixes)
  }
  result.input = fixes;

  return result;
};
