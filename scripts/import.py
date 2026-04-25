import wikipedia
# Set language to english
wikipedia.set_lang("en")
# Get page content
page = wikipedia.page("William Shakespeare")
text = page.content
# Save to file
with open("william_shakespeare.txt", "w", encoding="utf-8") as f:
    f.write(text)
