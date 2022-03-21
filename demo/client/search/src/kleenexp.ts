let kleenExpCache = {}

function delay(time: number): Promise<null> {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null), time)
  });
}

const debounce = <T>(callback: (...args: any[]) => Promise<T>, wait: number): (...args: any[]) => Promise<T|null> => {
  let id = 0
  return (...args: any[]) => {
    id++
    let my_id = id
    return new Promise<T>((resolve, reject) => {
      window.setTimeout(() => {
        if (id == my_id) {
          callback(...args)
            .then(resolve)
        } else {
          resolve(null)
        }
      }, wait)
    })
  }
}

export const compileKleenexp = async (ke: string): Promise<string|Error> => {
  if (!ke.match(/[\[\]]/)) {
    return ke
  }
  if (ke in kleenExpCache) {
    let result = kleenExpCache[ke]
    console.log(`/${ke}/ >> /${result}/`)
    return result
  }
  console.log(`no /${ke}/ in cache`)
  return compileKleenexpAsync(ke)
}

const doCompileKleenexpRemotely = async (ke: string): Promise<string|Error> => {
  try {
    let response = await fetch('/kleenexp/?' + new URLSearchParams({kleenexp: ke}))
    if (!response.ok) {
      return Error(response.statusText)
    }
    let j = await response.json()
    let re = j['regex']
    if (re != undefined) {
      kleenExpCache[ke] = re
      console.log(`${ke} => ${re}`)
      return re
    }
    let e = new Error(j['error'])
    kleenExpCache[ke] = e
    console.log(`/${ke}/: /${e}/`)
    return e
  } catch (e) {
    // don't cache, might not be an issue with the kleenexp
    return Error(e.message)
  }
}

export const compileKleenexpAsync: (string) => Promise<string|Error> = debounce(doCompileKleenexpRemotely, 100)
