# Kapitola 6: Hratelné Demo

Součástí tohoto repozitáře je plně funkční a hratelné demo (Level 1), které demonstruje všechny naprogramované základní mechaniky a technologická řešení.

## Aktuální stav dema (Co lze ve hře zažít)
- **Kompletní herní smyčka:** Demo obsahuje interaktivní Hlavní menu, samotný gameplay, obrazovku smrti (Game Over) a obrazovku vítězství. Vše je podbarveno hudbou, která chytře reaguje na stav hry.
- **Fyzika a pohyb:** Implementována přesná gravitace, detekce kolizí s klasickými plošinami a pokročilá **kruhová fyzika** na rotujících ozubených kolech (kolo hráče reálně unáší po svém obvodu).
- **Mario systém (Power-upy):** V demu se nachází sběratelská hvězda, která robota zvětší a přidá mu život. Při následném zásahu od nepřátel robot nezemře, ale s efektem blikání (dočasná nesmrtelnost) se zmenší zpět.
- **Umělá inteligence nepřátel:** Demo představuje plně funkční střílející věž. Věž dynamicky vypočítává úhel a natáčí svou hlaveň přímo na pohybujícího se hráče, přičemž vizuálně indikuje blížící se výstřel rozžhavením diody.

## Technologické úspěchy dema
- **Čistý JavaScript a Canvas:** Hra nevyužívá žádný externí herní engine (jako Unity nebo Godot), veškeré renderování a fyzika jsou napsány od nuly.
- **FPS Lock (Delta Time):** Demo je optimalizováno pro všechny typy obrazovek. Díky přesnému výpočtu času mezi snímky běží hra plynule a identicky na 60Hz i 200Hz monitorech.
- **Příprava pro Desktop:** Demo je strukturováno tak, aby ho bylo možné snadno zabalit pomocí frameworku Electron do samostatného `.exe` souboru pro Windows.
