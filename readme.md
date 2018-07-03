# Webfonts lokal und asyncron/gecacht ausliefern

Ich hatte bei Google Fonts schon immer das Gefühl, dass es ein Tracker ist und habe vor Jahren diese Technik entwicklet und bei vielen Projekten produktiv eingesetzt. Leider komme ich erst jetzt dazu, sie einer breiten Öffentlichkeit zu zeigen.

## Theorie

Der einfachste Weg Schriften selbst zu hosten und zu verwenden ist die Definition im Stylesheet. Das hat aber Nachteile: Render Blocking CSS, Flash of invisible text/Flash of unstyled text.

Um diese Probleme zu umgehen nutze ich folgendes Vorgehen:

1. Subsetting
2. Nur WOFF und WOFF2 nutzen, Fallbacks bereitstellen
3. Schriften als base64 in CSS Dateien importieren (LESS)
4. minifizieren und autoprefix
5. WOFF/WOFF2 Feature Detection
6. CSS Datei mit Schriften laden und im localStorage cachen
7. Bei erneutem Aufruf, direkt aus dem Cache laden

Der Einsatz von Javascript ist minimal und stört das Rendering minimal. Währen der Ladezeit wird der im CSS definierte Fallback (z. B. ``sans-serif``) benutzt. Es gibt keinen FOUT/FOIT.

## Dateistruktur

Dabei verwende ich in meinen Projekten eine Ordnerstruktur wie die Folgende.

````
.
+-- assets/                 Arbeitsdateien
|   +-- fonts/                  Schriften
|   +-- js/                     Magic
|   +-- less/                   Styling
+-- dist/                   Build Dateien
|   +-- css/                    Kompilierte CSS Dateien
|   +-- js/                     JS Dateien und Polyfills
````

## Subsetting

Richtig gute Schriften enthalten so ziemlich jedes erdenkliche Schriftzeichen, aus allen möglichen Sprachen. Das ist ziemlich cool, wenn man im Print mehrsprachig arbeitet und so die selbe Schrift für alle Anwendungsfälle nutzen kann. Im Web müssen wir mit unseren Datenmengen etwas haushalten, darum verwenden wir nur eine Teilmenge (Subset) des gesamten Umfangs einer Schrift.

### Anforderungen

Wir liefern Webfonts nur als WOFF und WOFF2 aus. Diese beiden Formate sind recht sparsam in ihrer Dateigröße. Ältere Browser nutzen dann unsere Fallback-Fonts.

Wir schließen Charaktere ein, die für den Sprachraum unseres Projekts typisch sind. In Sachsen bzw. in der Region Ostdeutschland sind neben den Umlauten auch Akzentuierungen aus dem Polnischen und Tschechischen sinnvoll. Besonders bei EU geförderten Projekten im Grenzraum sollte darauf geachtet werden, dass Namen o. Ä. korrekt angezeigt werden können.

Zusätztlich integrieren wir italienische Akzentuerung, da der deutsche Wortschatz historisch mit Italienisch gespickt ist.

Außerdem können wir einzelne Zeichen, wie Währungssymbole oder Unicode-Charaktere hinzufügen, um das Set an das Projekt anzupassen.

Bei jedem Projekt kann die Auswahl der Sprachen individuell angepasst werden. Bei einem mehrsprachigen Projekt sollte überlegt werden die Schriften aufzuteilen und nach Sprache auszuliefern.

### Subsetting mit dem Webfont Generator von Font Squirrel

Relativ einfach geht es mit dem Webfont Generator https://www.fontsquirrel.com/tools/webfont-generator

Das sind die Standard-Einstellungen, die ich meistens nutze:

* **Expert**
* Formate: **WOFF** und **WOFF2**
* Truetype Hinting: **Keep Existing**
* Rendering: nur **Fix GASP Table**
* Vertical Metrics: **No Adjustment**
* Fix Missing Glyphs: **Spaces** und **Hyphens**
* X-height Matching: **none**
* Protection: wirkungslos bei WOFF
* Subsetting: **Custom Subsetting**
* Character Type: **Lowercase**, **Uppercase**, **Numbers**, **Punctuation**, **Typographics**, **Diacriticals**
* Language: **Czech**, **German**, **Italian**, **Polish**
* Unicode Tables: **Basic Latin**, **Latin-1 Sup**, **Punctuation**
* Single Characters: ↓↑→←€
* OpenType Features: **Keep All**
* Font Name Suffix: **-wf**
* **Remember my settings**

Aus dem Download kopiere ich die .woff und .woff2 Dateien in den Ordner ``/assets/fonts/``

### Fonts als base64 in css

Mit Hilfe des Prepozessors LESS erzeugen wir zwei CSS-Dateien. In ihnen sind jeweils die WOFF und WOFF2 Schriften base64 codiert gespeichert.

Die beiden Dateien werden automatisch aus der zentralen Datei generiert:
``/assets/less/fonts/font.less``

Im Kopf der Datei finden sich drei Variablen

| Variable | Wert | Bedeutung |
|---|---|---|
| @font-name | Fira Sans Corporate | Name der Schrift für ``font-family`` |
| @font-base | firasans | Dateinamen-Basis |
| @font-path | assets/fonts/ | Aufbewahrungsort |

Oft kommt es vor, dass der Regular-Schnitt einen abweichenden Dateinamen trägt. So kann dieser _Fontname-wf.woff_ statt _Fontname-regular-wf.woff_ heißen. Wenn wir hier etwas übersehen, zweigt das in den generierten CSS Dateien indem dort die Dateipfade statt eines base64 Strings zu finden ist. Oder an einem 404 Request auf eine Schriftdatei im Livesystem...

### Feature Detection

Wie oben schon erwähnt, liefern wir nur Schriften an moderne Browser aus.

TTF oder gar EOT Schriften sind Ballast für Nutzer mit derartig beschränkten Browsern. Statt sie mit Polyfills und Workarounds zu überschütten, sollten wir ihnen eine User Experience bieten, die ihnen wirklich hilft. Aber das nur am Rande.

Mit dem [woff feature test](https://github.com/filamentgroup/woff2-feature-test) prüfen wir ob wir überhaupt etwas tun sollten.

### Caching

Wenn der Test erfolgreich war, lassen wir das script ``/assets/js/localfont.js`` los. Es prüft ob die Datei, die für den aktuellen Browser sinvoll ist (woff.css/woff2.css) bereits im localStorage existiert und die Version noch aktuell ist. Wenn nicht lädt es die jeweilige CSS-Datei und speichert sie und ihren Hash in den localStorage.

### Minifying

Für optimale Performance ist Minifizierung selbstverständlich. Hierum kümmern sich _cssnano_ als teil von _postcss_ und _uglify_.

Je nach Menge der Schriften können unsere CSS Dateien mit den Inline-Schriften recht groß werden. Wir werden zwar nicht das Maximum von 10 MB pro Domain in Chrome sprechen können, aber wir sollten immer mal einen Blick auf die Dateigröße werfen.


## Praxis

In diesem Beispiel wird die ganze Routine Arbeit von Grunt erledigt. Dazu dient der CLI Befehl ``grunt lf``. Im ``gruntfile`` ist gut zu sehen, wie die automatisierten Prozesse ablaufen.

Zuerst wird mit einem Shell Script ein Hash der ``/assets/less/fonts/font.less`` erzeugt und in als JS Variable in der ``/assets/js/fontHash.js`` gespeichert. Sie wird zusammen mit der Feature Detection und dem ``localfont`` Script zu einer Datei zusammengefasst und minifiziert. Der Hash sorg für die Versionierung.

Die CSS Dateien ``/dist/css/woff.css`` und ``/dist/css/woff2.css`` werden von LESS aus der  ``/assets/less/fonts/font.less`` generiert. Anschließend werden die automatisch mit Vendor-Prefixes versehen (autoprefix) und minifiziert (cssnano).

In unserem Font-Stack für unsere Website geben wir den Namen der Schrift (_@font-name_) als erstes an, dann einen geeigneten Fallback (vielleicht hat jemand die Schrift ja schon installiert) und dann den Standard-Stack.

Im Fuß unserer Website haben wir ein ``<script>`` Tag. Dort definieren wir die Variable ``basePath`` und inkludieren die ``/dist/js/localfont.js``, die vorher aus den drei Komponenten erzeugt wurde.

Der ``basePath`` ist wichtig für CMS wie Wordpress. Dort sollte der Pfad zum Theme Ordner (``var basePath = '<?php echo get_template_directory_uri() ?>/';``) hinterlegt werden, damit das Script die CSS-Dateien findet.

Jetzt sind wir einsatzbereit.

Der Scriptblock prüft zunächst, ob der aktuelle Browser überhaupt WOFF oder WOFF2 versteht. Wenn dem so ist, prüft das Script, ob wir im localStorage bereits eine Schrift gespeichert haben und ob die dem Hash entspricht. Wenn das der Fall ist, wird der Inhalt des Caches in ein ``<style>`` Tag im ``<head>`` der Website kopiert und die Scrift steht zur Verfügung.

Wenn die Schrift noch nicht im Cache ist oder veraltet (Unterschiedliche Hashes), wird die entsprechende CSS Datei mit AJAX geladen, in den localStorage geschrieben und aktiviert.

Solange die Schrift via JavaScript lädt, wird der Text mit der ersten passenden Fallback Font angezeigt und kann gelesen werden. Es kann vorkommen, dass sich Maße der Website und Laufweite der Schrift bei der Aktivierung ändern. Um den Effekt zu minimieren sollte die Fallback-Schrift ähnliche Eigenschaften haben (Zeilenhöhe, Laufweite, etc.).


## Todo

Das Berechnen und Speichern des Hashs könnte auch mit Node erledigt werden und wäre damit unabhängig von der Linux Konsole. Dafür fehlt mir aber das Fachwissen.


## Demo

Das Endergebnis gibts natürlich auch als [Demo](http://localfont.sebastianlaube.de).

Ich freue mich auf Feedback. Wer Rechtschreibfehler findet, kann sie behalten.
