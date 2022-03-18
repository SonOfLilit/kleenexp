let kleenExpCache = {};

function delay(time: number, v: any): Promise<null> {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, v), time)
  });
}

export const compileKleenexp = async function(ke: string): Promise<string> {
  await delay(0)
  return ke.toUpperCase()
}
