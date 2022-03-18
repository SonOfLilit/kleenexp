let kleenExpCache: Map<string, string|Error> = new Map();

function delay(time: number): Promise<null> {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null), time)
  });
}

export const compileKleenexp = async function(ke: string): Promise<string|Error> {
  if (kleenExpCache.has(ke)) {
    await delay(0)
    let result = kleenExpCache.get(ke)
    return result
  }
  return fetch('kleenexp/?' + new URLSearchParams({kleenexp: ke}))
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw Error(response.statusText);
    })
    .then(j => {
      let re = j['regex']
      if (re != undefined) {
        kleenExpCache[ke] = re
        console.log(`${ke} => ${re}`)
        return re
      }
      let e = new Error(j['error'])
      kleenExpCache[ke] = re
      console.log(`${ke}: ${e}`)
      return e
    })
    .catch((e: Error) => e.message)
}
