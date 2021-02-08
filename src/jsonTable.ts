import { JSDOM } from 'jsdom'

export interface FormatterOptions {
  showArrayIndex?: boolean
  hyperlinks?: {
    enable: boolean
    keys: any[]
    target: string
  }
  bool?: {
    text?:  {
      true : string
      false : string
    }
    img?: {
      true: string
      false: string
    }
    showImage?: boolean
    showText?: boolean
  }
}

const { document } = new JSDOM('').window

function makePrefixer(prefix: string): (name: string) => string {
  return function (name: string): string {
    return prefix + "-" + name
  }
}

const prefixer = makePrefixer("jh")
const p = prefixer
const ARRAY = 2
const BOOL = 4
const INT = 8
const FLOAT = 16
const STRING = 32
const OBJECT = 64
const SPECIAL_OBJECT = 128
const FUNCTION = 256
const UNK = 1

const STRING_CLASS_NAME = p("type-string")
const STRING_EMPTY_CLASS_NAME = p("type-string") + " " + p("empty")

const BOOL_TRUE_CLASS_NAME = p("type-bool-true")
const BOOL_FALSE_CLASS_NAME = p("type-bool-false")
const BOOL_IMAGE = p("type-bool-image")
const INT_CLASS_NAME = p("type-int") + " " + p("type-number")
const FLOAT_CLASS_NAME = p("type-float") + " " + p("type-number")

const OBJECT_CLASS_NAME = p("type-object")
const OBJ_KEY_CLASS_NAME = p("key") + " " + p("object-key")
const OBJ_VAL_CLASS_NAME = p("value") + " " + p("object-value")
const OBJ_EMPTY_CLASS_NAME = p("type-object") + " " + p("empty")

const FUNCTION_CLASS_NAME = p("type-function")

const ARRAY_KEY_CLASS_NAME = p("key") + " " + p("array-key")
const ARRAY_VAL_CLASS_NAME = p("value") + " " + p("array-value")
const ARRAY_CLASS_NAME = p("type-array")
const ARRAY_EMPTY_CLASS_NAME = p("type-array") + " " + p("empty")

const HYPERLINK_CLASS_NAME = p('a')
const UNKNOWN_CLASS_NAME = p("type-unk")

const indexOf = [].indexOf
const isArray = Array.isArray

/** Create and set a node for a piece of data. */
function setNode(tagName: string, className: string, data: any): HTMLElement {
  const result = document.createElement(tagName);

  result.className = className;
  result.appendChild(document.createTextNode(`${data}`));

  return result;
}

/** Create and set one or more child nodes on a new node. */
function setChildNode(tagName: string, className: string, child: HTMLElement | HTMLElement[]): HTMLElement {
  const result = document.createElement(tagName)

  result.className = className

  if (isArray(child)) {
      for (let i = 0, len = child.length; i < len; i += 1) {
          result.appendChild(child[i]);
      }
  } else {
      result.appendChild(child);
  }

  return result;
}

function linkNode(child: HTMLElement, href: string, target: string): HTMLElement {
  const a = setChildNode("a", HYPERLINK_CLASS_NAME, child)

  a.setAttribute('href', href);
  a.setAttribute('target', target);

  return a;
}

function getType(obj: any): number {
  const type = typeof obj;

  switch (type) {
    case "boolean":
      return BOOL;
    case "string":
      return STRING;
    case "number":
      return (obj % 1 === 0) ? INT : FLOAT;
    case "function":
      return FUNCTION;
    default:
      if (isArray(obj)) {
        return ARRAY;
      } else if (obj === Object(obj)) {
        if (obj.constructor === Object) {
          return OBJECT;
        }

        return OBJECT | SPECIAL_OBJECT
      } else {
        return UNK;
      }
  }
}

function _format(data: any, options: any, parentKey?: number | string): HTMLElement {
  let result: HTMLElement
  let container: HTMLElement
  let key: number | string
  let keyNode: HTMLElement
  let valNode: HTMLElement
  let len: number
  let childs: HTMLElement[]
  let tr: HTMLElement
  let value: any
  let isEmpty = true
  let isSpecial = false
  let type = getType(data)
  // Initialized & used only in case of objects & arrays
  let hyperlinksEnabled
  let aTarget
  let hyperlinkKeys

  switch (type) {
    case OBJECT:
      if (type & SPECIAL_OBJECT) {
        isSpecial = true;
      }
      childs = [];

      aTarget =  options.hyperlinks.target;
      hyperlinkKeys = options.hyperlinks.keys;

      // Is Hyperlink Key
      hyperlinksEnabled =
          options.hyperlinks.enable &&
          hyperlinkKeys &&
          hyperlinkKeys.length > 0;

      for (key in data) {
        isEmpty = false;

        value = data[key];

        if (key === 'schema' && typeof value === 'object') {
          tr = document.createElement("tr");
          keyNode = setNode("h4", OBJ_KEY_CLASS_NAME, 'Schema');
          valNode = setNode('pre', STRING_CLASS_NAME, JSON.stringify(value, null, 2))
          tr.appendChild(keyNode);
          tr.appendChild(valNode);
          childs.push(tr);
          continue
        }

        valNode = _format(value, options, key);
        keyNode = setNode("th", OBJ_KEY_CLASS_NAME, key);

        if( hyperlinksEnabled &&
            typeof(value) === 'string' &&
            indexOf.call(hyperlinkKeys, key) >= 0){

            valNode = setChildNode("td", OBJ_VAL_CLASS_NAME, linkNode(valNode, value, aTarget));
        } else {
            valNode = setChildNode("td", OBJ_VAL_CLASS_NAME, valNode);
        }

        tr = document.createElement("tr");
        tr.appendChild(keyNode);
        tr.appendChild(valNode);

        childs.push(tr);
      }

      if (isSpecial) {
          result = setNode('span', STRING_CLASS_NAME, data.toString())
      } else if (isEmpty) {
          result = setNode("span", OBJ_EMPTY_CLASS_NAME, "(Empty Object)");
      } else {
          result = setChildNode("table", OBJECT_CLASS_NAME, setChildNode("tbody", '', childs));
      }
      break
    case ARRAY:
      if (data.length > 0) {
        childs = [];
        var showArrayIndices = options.showArrayIndex;

        aTarget = options.hyperlinks.target;
        hyperlinkKeys = options.hyperlinks.keys;

        // Hyperlink of arrays?
        hyperlinksEnabled = parentKey && options.hyperlinks.enable &&
            hyperlinkKeys &&
            hyperlinkKeys.length > 0 &&
            indexOf.call(hyperlinkKeys, parentKey) >= 0;

        for (key = 0, len = data.length; key < len; key += 1) {

            keyNode = setNode("th", ARRAY_KEY_CLASS_NAME, key);
            value = data[key];

            if (hyperlinksEnabled && typeof(value) === "string") {
                valNode = _format(value, options, key);
                valNode = setChildNode("td", ARRAY_VAL_CLASS_NAME,
                    linkNode(valNode, value, aTarget));
            } else {
                valNode = setChildNode("td", ARRAY_VAL_CLASS_NAME,
                    _format(value, options, key));
            }

            tr = document.createElement("tr");

            if (showArrayIndices) {
                tr.appendChild(keyNode);
            }
            tr.appendChild(valNode);

            childs.push(tr);
        }

        result = setChildNode("table", ARRAY_CLASS_NAME, setChildNode("tbody", '', childs));
      } else {
        result = setNode("span", ARRAY_EMPTY_CLASS_NAME, "(Empty List)");
      }
      break
    case BOOL:
      var boolOpt = options.bool;
      container = document.createElement('div');

      if (boolOpt.showImage) {
          var img = document.createElement('img');
          img.setAttribute('class', BOOL_IMAGE);

          img.setAttribute('src',
              '' + (data ? boolOpt.img.true : boolOpt.img.false));

          container.appendChild(img);
      }

      if (boolOpt.showText) {
          container.appendChild(data ?
              setNode("span", BOOL_TRUE_CLASS_NAME, boolOpt.text.true) :
              setNode("span", BOOL_FALSE_CLASS_NAME, boolOpt.text.false));
      }

      result = container;
      break
    case STRING:
      if (data === "") {
        result = setNode("span", STRING_EMPTY_CLASS_NAME, "(Empty Text)");
      } else {
          result = setNode("span", STRING_CLASS_NAME, data);
      }
      break
    case INT:
      result = setNode("span", INT_CLASS_NAME, data);
      break
    case FLOAT:
      result = setNode("span", FLOAT_CLASS_NAME, data);
      break
    case FUNCTION:
      result = setNode("span", FUNCTION_CLASS_NAME, data);
      break
    default:
      result = setNode("span", UNKNOWN_CLASS_NAME, data);
      break
  }

  return result;
}

/** Validate options and create defaults. */
function validateOptions(options: FormatterOptions): FormatterOptions {
  // Validate or create showArrayIndex option.
  options.showArrayIndex = typeof options.showArrayIndex === 'boolean' ? options.showArrayIndex : false

  // Validate or create hyperlinks option.
  if(typeof options.hyperlinks === 'object' && options.hyperlinks.enable) {
    const hyperlinks = {
      enable: true,
      keys: Array.isArray(options.hyperlinks.keys) ? options.hyperlinks.keys : [],
      target: typeof options.hyperlinks.target === 'string' ? options.hyperlinks.target : '_blank'
    }

    options.hyperlinks = hyperlinks
  } else {
    options.hyperlinks = {
      enable: false,
      // Keys was null at one point by default, may need to re-evaluate.
      keys: [],
      target: ''
    }
  }

  // Validate or create options for booleans.
  if (typeof options.bool === 'object' && options.bool !== null) {
    const boolOptions = options.bool

    // Show text if no option
    if (!boolOptions.showText && !boolOptions.showImage) {
      boolOptions.showImage = false
      boolOptions.showText = true
    }

    if (boolOptions.showText) {
      if(typeof boolOptions.text !== 'object'){
        boolOptions.text = {
          true : 'true',
          false : 'false'
        }
      } else {
        const t = boolOptions.text.true
        const f = boolOptions.text.false;

        if(getType(t) !== STRING || t === ''){
          boolOptions.text.true = 'true'
        }

        if(getType(f) !== STRING || f === ''){
          boolOptions.text.false = 'false'
        }
      }
    }

    if(
      boolOptions.showImage &&
      (
        typeof boolOptions.text !== 'object' ||
        (typeof boolOptions.img.true !== 'string' && typeof boolOptions.img.false !== 'string')
      )
    ) {
      boolOptions.showImage = false
    }
  } else {
    options.bool = {
      text:  {
          true : 'true',
          false : 'false'
      },
      img : {
          true: '',
          false: ''
      },
      showImage : false,
      showText : true
    }
  }

  return options
}

export function format(data: any, options: FormatterOptions = {}): string {
  const result = _format(data, validateOptions(options))
  result.className = result.className + " " + prefixer("root")

  return result.outerHTML
}
