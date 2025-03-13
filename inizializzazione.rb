♦nizio con la configurazione di un progetto git

 • inizializza un repositori git :
 
>    git init -b main
---  Initialized empty Git repository in /03-Deploy-to-the-web/.git/
>    git commit --allow-empty -m "Initial commit."
---  [main (root-commit) beddd39] Initial commit.


 • Aggiungi tutti i file ed esegui il commit

>   git add .
>   git commit -m "Initial implementation of Connect Four game."
--- [main 9c3179e] Initial implementation of Connect Four game.
--- 7 files changed, 212 insertions(+)
--- create mode 100644 app.py
--- create mode 100644 connect4.css
--- create mode 100644 connect4.js
--- create mode 100644 connect4.py
--- create mode 100644 index.html
--- create mode 100644 inizializzazione.rb
--- create mode 100644 main.js

♦ Dopo aver creato un nuovo repositori su github pubblico

>   git remote add origin git@github.com:nome_utente_github/nome_repository.git
>   git branch -M main
>   git push -u origin main
...
--- To github.com:nome_utente_github/websockets-tutorial.git
--- * [new branch]      main -> main
--- Branch 'main' set up to track remote branch 'main' from 'origin'.

LINK:
https://mirydev.github.io/websockets-tutorial