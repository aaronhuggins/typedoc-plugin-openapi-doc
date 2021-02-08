/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { JSDOM } from 'jsdom'

export interface FormatterOptions {
  showArrayIndex?: boolean
  bool?: {
    text?: {
      true: string
      false: string
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

function makePrefixer (prefix: string): (name: string) => string {
  return function (name: string): string {
    return prefix + '-' + name
  }
}

const prefixer = makePrefixer('jh')
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

const STRING_CLASS_NAME = p('type-string')
const STRING_EMPTY_CLASS_NAME = p('type-string') + ' ' + p('empty')

const BOOL_TRUE_CLASS_NAME = p('type-bool-true')
const BOOL_FALSE_CLASS_NAME = p('type-bool-false')
const BOOL_IMAGE = p('type-bool-image')
const INT_CLASS_NAME = p('type-int') + ' ' + p('type-number')
const FLOAT_CLASS_NAME = p('type-float') + ' ' + p('type-number')

const OBJECT_CLASS_NAME = p('type-object')
const OBJ_KEY_CLASS_NAME = p('key') + ' ' + p('object-key')
const OBJ_VAL_CLASS_NAME = p('value') + ' ' + p('object-value')
const OBJ_EMPTY_CLASS_NAME = p('type-object') + ' ' + p('empty')

const FUNCTION_CLASS_NAME = p('type-function')

const ARRAY_KEY_CLASS_NAME = p('key') + ' ' + p('array-key')
const ARRAY_VAL_CLASS_NAME = p('value') + ' ' + p('array-value')
const ARRAY_CLASS_NAME = p('type-array')
const ARRAY_EMPTY_CLASS_NAME = p('type-array') + ' ' + p('empty')

const UNKNOWN_CLASS_NAME = p('type-unk')

const isArray = Array.isArray

/** Create and set a node for a piece of data. */
function setNode (tagName: string, className: string, data: string | number): HTMLElement {
  const result = document.createElement(tagName)

  result.className = className
  result.appendChild(document.createTextNode(`${data}`))

  return result
}

/** Create and set one or more child nodes on a new node. */
function setChildNode (tagName: string, className: string, child: HTMLElement | HTMLElement[]): HTMLElement {
  const result = document.createElement(tagName)

  result.className = className

  if (isArray(child)) {
    for (let i = 0, len = child.length; i < len; i += 1) {
      result.appendChild(child[i])
    }
  } else {
    result.appendChild(child)
  }

  return result
}

function getType (obj: any): number {
  const type = typeof obj

  switch (type) {
    case 'boolean':
      return BOOL
    case 'string':
      return STRING
    case 'number':
      return (obj % 1 === 0) ? INT : FLOAT
    case 'function':
      return FUNCTION
    default:
      if (isArray(obj)) {
        return ARRAY
      } else if (obj === Object(obj)) {
        if (obj.constructor === Object) {
          return OBJECT
        }

        return OBJECT | SPECIAL_OBJECT
      } else {
        return UNK
      }
  }
}

function _format (data: any, options: FormatterOptions, parentKey?: number | string): HTMLElement {
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
  const type = getType(data)

  switch (type) {
    case OBJECT:
      if (type & SPECIAL_OBJECT) {
        isSpecial = true
      }
      childs = []

      for (key in data) {
        isEmpty = false

        value = data[key]

        if (key === 'schema' && typeof value === 'object') {
          tr = document.createElement('tr')
          keyNode = setNode('h4', OBJ_KEY_CLASS_NAME, 'Schema')
          valNode = setNode('pre', STRING_CLASS_NAME, JSON.stringify(value, null, 2))
          tr.appendChild(keyNode)
          tr.appendChild(valNode)
          childs.push(tr)
          continue
        }

        valNode = _format(value, options, key)

        keyNode = setNode('th', OBJ_KEY_CLASS_NAME, key)
        valNode = setChildNode('td', OBJ_VAL_CLASS_NAME, valNode)

        tr = document.createElement('tr')
        tr.appendChild(keyNode)
        tr.appendChild(valNode)

        childs.push(tr)
      }

      if (isSpecial) {
        result = setNode('span', STRING_CLASS_NAME, data.toString())
      } else if (isEmpty) {
        result = setNode('span', OBJ_EMPTY_CLASS_NAME, '(Empty Object)')
      } else {
        result = setChildNode('table', OBJECT_CLASS_NAME, setChildNode('tbody', '', childs))
      }
      break
    case ARRAY:
      if (data.length > 0) {
        childs = []
        var showArrayIndices = options.showArrayIndex

        for (key = 0, len = data.length; key < len; key += 1) {
          keyNode = setNode('th', ARRAY_KEY_CLASS_NAME, key)
          value = data[key]

          valNode = setChildNode('td', ARRAY_VAL_CLASS_NAME, _format(value, options, key))

          tr = document.createElement('tr')

          if (showArrayIndices) {
            tr.appendChild(keyNode)
          }
          tr.appendChild(valNode)

          childs.push(tr)
        }

        result = setChildNode('table', ARRAY_CLASS_NAME, setChildNode('tbody', '', childs))
      } else {
        result = setNode('span', ARRAY_EMPTY_CLASS_NAME, '(Empty List)')
      }
      break
    case BOOL:
      var boolOpt = options.bool
      container = document.createElement('div')

      if (boolOpt.showImage) {
        var img = document.createElement('img')
        img.setAttribute('class', BOOL_IMAGE)

        img.setAttribute('src',
          `${typeof data === 'boolean' && data ? boolOpt.img.true : boolOpt.img.false}`
        )

        container.appendChild(img)
      }

      if (boolOpt.showText) {
        container.appendChild(data
          ? setNode('span', BOOL_TRUE_CLASS_NAME, boolOpt.text.true)
          : setNode('span', BOOL_FALSE_CLASS_NAME, boolOpt.text.false))
      }

      result = container
      break
    case STRING:
      if (data === '') {
        result = setNode('span', STRING_EMPTY_CLASS_NAME, '(Empty Text)')
      } else {
        result = setNode('span', STRING_CLASS_NAME, data)
      }
      break
    case INT:
      result = setNode('span', INT_CLASS_NAME, data)
      break
    case FLOAT:
      result = setNode('span', FLOAT_CLASS_NAME, data)
      break
    case FUNCTION:
      result = setNode('span', FUNCTION_CLASS_NAME, data)
      break
    default:
      result = setNode('span', UNKNOWN_CLASS_NAME, data)
      break
  }

  return result
}

export function format (data: any): string {
  const options: FormatterOptions = {
    showArrayIndex: false,
    bool: {
      text: {
        true: 'true',
        false: 'false'
      },
      img: {
        true: '',
        false: ''
      },
      showImage: false,
      showText: true
    }
  }
  const result = _format(data, options)
  result.className = result.className + ' ' + prefixer('root')

  return result.outerHTML
}
