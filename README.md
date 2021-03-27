# Buzzer.js

Simple JS buzzer app for debates.  See each project's readme for details about running in a development environment.

## So...what is this thing?

This is intended as a companion app to people participating in online debates. It keeps track of the topic at-hand, the speakers participating in the debate, how much time is allotted to the current speaker, and how long they've been talking. The app also handles an optional roundtable phase for each topic, during which anyone should be able to chime in. It's not really intended to be a hardline limit on how long people can talk, but rather a guideline to help ensure everyone has a more equal say in the debate overall.

I decided to create this after binging on Twitch debates for a month or so. I discovered that, alot of times, proceedings devolve into shouting matches when panelists start vying for time ontop of one another. I figured if everyone could see the clock, it would help assuage desires to interrupt or attempt to over-power fellow panelists with sheer volume.

So I created Buzzer.js as a utility that can quickly be bootstrapped prior to a debate, and used alongside discord or your conference software of choice to keep everyone on the same page. The app works well from a phone, or another browser window. The best part is it's entirely free, and entirely temporary - nothing is stored in permanent storage, it's all in memory for the session at hand, and when thats over it all gets destroyed. You do have the option to store your username in your browser's localStorage, but that's the only thing that persists.
