from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.gzip import GZipMiddleware

import ke

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return RedirectResponse("/alice/")

@app.get("/alice/")
async def alice_main():
    return FileResponse("index.html")

@app.get("/alice/regex/")
async def alice_regex():
    return FileResponse("index.html")

@app.get("/alice/kleenexp/")
async def alice_regex():
    return FileResponse("index.html")


@app.get("/kleenexp/")
async def kleenexp(kleenexp: str):
    try:
        return {"regex": ke.re(kleenexp, syntax="javascript")}
    except ke.KleenexpError as e:
        return {"error": str(e)}
