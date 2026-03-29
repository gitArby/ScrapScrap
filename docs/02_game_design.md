# Kapitola 2: Game Design

## Herní smyčka a Progrese
Hra využívá systém **nekonečného procedurálního generování**. Namísto jednoho pevného levelu hráč prochází sérií úrovní, jejichž obtížnost se neustále stupňuje (mezery se zvětšují, přibývá nepřátel a propastí). Hra počítá celkové skóre na základě ušlé vzdálenosti a bonusů za zabíjení nepřátel.

## Mechaniky postavy (Hráč)
Základním pohybem je chůze a skok. Hráč má ale k dispozici i pokročilé pohybové možnosti:
- **Dvojskok (Double Jump):** Hráč může ve vzduchu provést ještě jeden menší skok pro korigování dopadu.
- **Goomba Stomp:** Nepřátele lze zneškodnit tím, že jim hráč skočí přesně na hlavu. Tím získá body, odrazí se vysoko do vzduchu a obnoví se mu možnost dvojskoku.

**Systém zdraví a Power-upy:**
- **Základní stav (1 život):** Zásah znamená Game Over.
- **Velký stav (2 životy):** Po sebrání hvězdy se robot zvětší. Zásah ho pouze zmenší zpět a udělí dočasnou nesmrtelnost (blikání).
- **Zlatý stav (God mode):** Pokud hráč sebere hvězdu, když už je velký, získá zlatou auru a +2 životy.
- **Sběr Šrotu (Scraps):** Po mapě jsou rozesety matice (šrot). Za každých 100 nasbíraných kusů získává hráč život navíc (inspirace mincemi ze Super Mario).

## Environmentální překážky a Plošiny
- **Statické bloky:** Pevná zem.
- **Ozubená kola:** Rotující platformy využívající kruhovou fyziku (fungují jako běžící pásy).
- **Rozpadající se plošiny (Fragile):** Rezavé rošty, které se po dopadu začnou třást a následně spadnou do propasti.
- **Parní katapulty (Steam Vents):** Mříže chrlící páru, které hráče po dopadu obrovskou silou vystřelí vysoko do vzduchu.
- **Interaktivní bloky (Cihly a Q-Bloky):** Levitující bloky, do kterých lze zespodu udeřit. Cihly se zničí a dají body, Q-Bloky (Otazníky) náhodně odmění hráče hromadou šrotu nebo vzácnou hvězdou.

## Nepřátelé a Pasti
- **Sešrotovací Dupáček (Stomper):** Mechanický Goliáš, který hlídkuje na plošině. Jakmile hráče spatří, rozeběhne se na něj.
- **Industriální Věž (Turret):** Stacionární dělo. Jeho hlaveň (pomocí `Math.atan2`) neustále sleduje hráče a v pravidelných intervalech pálí žhavé projektily.
- **Pístová drtička (Piston Trap):** Smrtící čelisti, které se nečekaně vysouvají ze země. Nelze je zašlápnout, hráč se jim musí vyhnout.
- **Létající Dron (Hover Drone):** Vznáší se vysoko nad plošinami na základě goniometrické funkce Sinus. Jakmile hráče detekuje, začne ho pronásledovat a střílet na něj ze vzduchu.
