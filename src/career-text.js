// Text bank for the "My Career" mode.
// Plain browser script. Exposes CAR_TEXT as a global, and as a module export under Node.

const CAR_TEXT = {

  // Media interview questions. Placeholders: {team} {opp} {coach} {pts} {name}
  iv: [
    { k: 'any_biggest', when: 'any', q: "What is the one thing people get wrong about you?", a: [
      { t: "People think I only care about scoring, but I just want to make the right play.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "They underestimate how hard I work, and that is going to change this season.", tone: 'confident', fx: { fame: 2, trust: 0, chem: 0 } },
      { t: "Honestly, the people who doubt me have not been watching the games closely enough.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -1 } }
    ] },
    { k: 'any_style', when: 'any', q: "How would you describe your game to a kid who has never watched you play?", a: [
      { t: "I play hard, I share the ball, and I try to make my teammates better every night.", tone: 'humble', fx: { fame: 0, trust: 1, chem: 2 } },
      { t: "I am the best player on the floor every night, and I think people know it.", tone: 'confident', fx: { fame: 3, trust: 0, chem: -1 } },
      { t: "Nobody guards me the way they should, so I make them pay for it every time.", tone: 'fiery', fx: { fame: 3, trust: -2, chem: -1 } }
    ] },
    { k: 'any_city', when: 'any', q: "What does it mean to wear the {team} jersey?", a: [
      { t: "It means everything to me, and I want to earn every bit of the respect this city gives.", tone: 'humble', fx: { fame: 1, trust: 2, chem: 1 } },
      { t: "I know what this franchise is about, and I plan to be the face of it for years.", tone: 'confident', fx: { fame: 2, trust: 1, chem: 0 } },
      { t: "This city deserves a winner, and I am going to be the one who gives it one.", tone: 'fiery', fx: { fame: 3, trust: 0, chem: -2 } }
    ] },
    { k: 'any_offseason', when: 'any', q: "What does your offseason training look like?", a: [
      { t: "I put in the work every summer, and I owe a lot of that to the trainers who push me.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "I train like a machine, and everybody else is still sleeping while I am in the gym.", tone: 'confident', fx: { fame: 2, trust: 1, chem: 0 } },
      { t: "The guys who skip the summer work are going to find out the hard way who is ready.", tone: 'fiery', fx: { fame: 2, trust: -1, chem: -2 } }
    ] },
    { k: 'any_legacy', when: 'any', q: "How do you want to be remembered in this league?", a: [
      { t: "As a guy who treated everyone with respect and gave the game everything he had.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "As one of the best to ever play, and I am putting in the work to make that happen.", tone: 'confident', fx: { fame: 3, trust: 0, chem: 0 } },
      { t: "As the player who made the league pay attention, whether they liked it or not.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -1 } }
    ] },

    // Wins
    { k: 'win_run', when: 'win', q: "{team} beat {opp} tonight. What clicked for you?", a: [
      { t: "Our guys trusted the game plan, and every one of them did their job tonight.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "We knew we were the better team, and we went out and proved it.", tone: 'confident', fx: { fame: 2, trust: 0, chem: 0 } },
      { t: "Their coach talked a lot before the game, and we let our play do the answering.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -1 } }
    ] },
    { k: 'win_pts', when: 'win', q: "You put up {pts} points tonight. Did you see that kind of game coming?", a: [
      { t: "Not really, but my teammates kept finding me in the right spots all night.", tone: 'humble', fx: { fame: 0, trust: 1, chem: 2 } },
      { t: "I have been preparing for nights like this, so it did not surprise me at all.", tone: 'confident', fx: { fame: 3, trust: 0, chem: 0 } },
      { t: "Tonight was a reminder of what I can do when nobody can stop me.", tone: 'fiery', fx: { fame: 3, trust: 0, chem: -2 } }
    ] },
    { k: 'win_coach', when: 'win', q: "Coach {coach} says you made the difference. How do you respond?", a: [
      { t: "Coach put us in position to win, and I just tried to finish what we started.", tone: 'humble', fx: { fame: 0, trust: 3, chem: 2 } },
      { t: "I appreciate the praise, but I expect to be the difference every time I step on the floor.", tone: 'confident', fx: { fame: 2, trust: 1, chem: -1 } },
      { t: "The coach is right, and some people in this building should be saying the same thing.", tone: 'fiery', fx: { fame: 2, trust: -1, chem: -2 } }
    ] },
    { k: 'win_doubt', when: 'win', q: "Some people say {opp} is better than this. What do you say to that?", a: [
      { t: "They have a great team, and we respect them, but tonight we were ready.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "Those people will keep talking until we keep winning, and we plan to keep winning.", tone: 'confident', fx: { fame: 3, trust: 0, chem: 0 } },
      { t: "They can say what they want, but that scoreboard does not lie, and it does not care about their opinion.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -1 } }
    ] },

    // Losses
    { k: 'loss_hurt', when: 'loss', q: "That one stings. Where did {team} lose it tonight?", a: [
      { t: "We gave up too many easy looks in the second half, and that is on all of us.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "We got outplayed in the fourth, and we are going to fix it before the next game.", tone: 'confident', fx: { fame: 1, trust: 1, chem: 0 } },
      { t: "Somebody on that bench needs to answer for the way we played down the stretch.", tone: 'fiery', fx: { fame: 3, trust: -2, chem: -3 } }
    ] },
    { k: 'loss_you', when: 'loss', q: "You scored {pts} and the team still lost. Is that on you?", a: [
      { t: "Scoring does not matter if we lose, so I have to find ways to help more than that.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "I did my part, and the rest of the guys have to pick up their share too.", tone: 'confident', fx: { fame: 2, trust: -1, chem: -2 } },
      { t: "I played well enough to win, so the blame belongs to the guys who did not show up.", tone: 'fiery', fx: { fame: 2, trust: -2, chem: -3 } }
    ] },
    { k: 'loss_refs', when: 'loss', q: "Some fans are blaming the refs for the loss. Do you agree?", a: [
      { t: "I am not going to make excuses. We had chances and we did not finish them.", tone: 'humble', fx: { fame: 0, trust: 3, chem: 1 } },
      { t: "The calls did not go our way, but we should have been able to win anyway.", tone: 'confident', fx: { fame: 2, trust: 1, chem: 0 } },
      { t: "Those calls were a joke, and the league knows it, even if they will not say so.", tone: 'fiery', fx: { fame: 3, trust: -2, chem: -1 } }
    ] },

    // Slumps
    { k: 'slump_shot', when: 'slump', q: "Your shooting has been cold for a while. What is going on?", a: [
      { t: "I am not shooting the ball well right now, so I am working on my form every day.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "Shots not falling is part of the game, and they will start falling again soon.", tone: 'confident', fx: { fame: 1, trust: 1, chem: 0 } },
      { t: "People love to talk about my slump, but they forget I have been the best in this league before.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -2 } }
    ] },
    { k: 'slump_fans', when: 'slump', q: "Some fans want you on the bench. How do you answer them?", a: [
      { t: "I understand the frustration, and I am going to keep working until I earn their trust back.", tone: 'humble', fx: { fame: 0, trust: 3, chem: 1 } },
      { t: "I am still a starter for a reason, and I will prove it in the next few games.", tone: 'confident', fx: { fame: 2, trust: 0, chem: 0 } },
      { t: "Those fans can sit down themselves, because I am not going anywhere.", tone: 'fiery', fx: { fame: 3, trust: -2, chem: -1 } }
    ] },
    { k: 'slump_fix', when: 'slump', q: "What are you changing to get out of this slump?", a: [
      { t: "I am watching more film, and I am asking my teammates for honest feedback.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "I am going back to the basics, and I am confident the work will show up soon.", tone: 'confident', fx: { fame: 2, trust: 1, chem: 0 } },
      { t: "Nothing needs to change. The coaches just need to run the offense through me.", tone: 'fiery', fx: { fame: 2, trust: -1, chem: -3 } }
    ] },

    // Hot streaks
    { k: 'hot_streak', when: 'hot', q: "You have been unstoppable lately. Do you feel it?", a: [
      { t: "I feel good, but I am staying focused on the next game and not the last one.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "Yeah, I feel it. When I am rolling like this, I know I can take over a game.", tone: 'confident', fx: { fame: 3, trust: 0, chem: 0 } },
      { t: "Unstoppable is right. Anybody who tries to guard me is going to have a long night.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -2 } }
    ] },
    { k: 'hot_mvp', when: 'hot', q: "People are already talking MVP. Are you listening to that?", a: [
      { t: "I do not pay attention to that stuff. I just want to help this team win.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "I hear it, and I think I belong in that conversation if I keep this up.", tone: 'confident', fx: { fame: 3, trust: 0, chem: -1 } },
      { t: "MVP talk is fine, but the voters better be watching, because I am not slowing down.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -1 } }
    ] },
    { k: 'hot_clicking', when: 'hot', q: "What is clicking for you right now?", a: [
      { t: "My teammates are getting me great looks, and that makes it easy to be aggressive.", tone: 'humble', fx: { fame: 0, trust: 1, chem: 3 } },
      { t: "I finally feel comfortable in every spot on the floor, and it shows in the box score.", tone: 'confident', fx: { fame: 2, trust: 0, chem: 0 } },
      { t: "Everything is clicking because I stopped listening to the noise and started trusting myself.", tone: 'fiery', fx: { fame: 2, trust: -1, chem: -1 } }
    ] },

    // Rookie
    { k: 'rook_pace', when: 'rookie', q: "This is your first season. How are you handling the pace of the league?", a: [
      { t: "It is faster than college, and I am learning something new every single day.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "The speed is not a problem for me. I was built for this level since day one.", tone: 'confident', fx: { fame: 2, trust: 0, chem: 0 } },
      { t: "Some veterans think the rookies cannot keep up, and I plan to prove them wrong tonight.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -2 } }
    ] },
    { k: 'rook_vets', when: 'rookie', q: "The veterans on {team} have been in the league forever. What have they taught you?", a: [
      { t: "They taught me to take care of my body, and to listen before I speak in the locker room.", tone: 'humble', fx: { fame: 0, trust: 3, chem: 3 } },
      { t: "They showed me how to act like a pro, and I am already doing the things they do.", tone: 'confident', fx: { fame: 1, trust: 1, chem: 1 } },
      { t: "Honestly, I am the one teaching some of them a thing or two about today's game.", tone: 'fiery', fx: { fame: 2, trust: -1, chem: -2 } }
    ] },
    { k: 'rook_hype', when: 'rookie', q: "Your draft class is getting a lot of hype. Does that add pressure?", a: [
      { t: "A little, but I try to focus on my own game and let the rest take care of itself.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "I do not feel pressure. I expected this kind of attention since I was a kid.", tone: 'confident', fx: { fame: 3, trust: 0, chem: 0 } },
      { t: "The hype is for other guys. I am the one who is going to show up and deliver.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -2 } }
    ] },

    // Contract
    { k: 'con_money', when: 'contract', q: "Your contract is the talk of the league. Is money on your mind?", a: [
      { t: "I want to be paid fairly, but my main goal is to win and take care of my family.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "I have earned every dollar I am going to get, and I expect the front office to know that.", tone: 'confident', fx: { fame: 2, trust: 0, chem: 0 } },
      { t: "Money is the only thing the front office respects, so I will make sure they hear my number.", tone: 'fiery', fx: { fame: 3, trust: -2, chem: -2 } }
    ] },
    { k: 'con_stay', when: 'contract', q: "Do you see yourself finishing your career in {team} colors?", a: [
      { t: "I would love to, and I hope this city feels the same way about me someday.", tone: 'humble', fx: { fame: 0, trust: 3, chem: 2 } },
      { t: "I want to be here for the long haul, and I think we can build something special together.", tone: 'confident', fx: { fame: 2, trust: 1, chem: 1 } },
      { t: "That depends on whether this organization wants to win, because I am not waiting around forever.", tone: 'fiery', fx: { fame: 3, trust: -2, chem: -2 } }
    ] },
    { k: 'con_value', when: 'contract', q: "Some folks say you are underpaid. Do you agree?", a: [
      { t: "I am grateful for what I have, and I will keep working to justify it.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "I think I am one of the best values in the league, and the numbers back that up.", tone: 'confident', fx: { fame: 3, trust: 0, chem: -1 } },
      { t: "Underpaid is an understatement. Anybody who has watched me play knows that.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -1 } }
    ] },

    // Trade
    { k: 'trade_rumor', when: 'trade', q: "The trade rumors keep swirling. Did you hear anything?", a: [
      { t: "I am focused on this team right now, and I do not let rumors into my head.", tone: 'humble', fx: { fame: 0, trust: 3, chem: 2 } },
      { t: "I have heard the talk, and it does not change how I prepare for every game.", tone: 'confident', fx: { fame: 2, trust: 1, chem: 0 } },
      { t: "Every rumor is some reporter guessing, and I am tired of reading their made-up stories.", tone: 'fiery', fx: { fame: 2, trust: -2, chem: -1 } }
    ] },
    { k: 'trade_new', when: 'trade', q: "A new team is calling about you. What would it take to win you over?", a: [
      { t: "I want a team that is serious about winning and treats its players like family.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "Any team that wants me has to show me a real plan to contend, and then we will talk.", tone: 'confident', fx: { fame: 2, trust: 1, chem: 0 } },
      { t: "Tell them to bring a serious offer, because I am not interested in being a rebuild project.", tone: 'fiery', fx: { fame: 3, trust: -2, chem: -2 } }
    ] },
    { k: 'trade_ask', when: 'trade', q: "Have you asked the front office for a move?", a: [
      { t: "I have had a conversation with management, and we both want what is best for the team.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 1 } },
      { t: "I have made my feelings known, and I think the front office understands where I stand.", tone: 'confident', fx: { fame: 2, trust: 0, chem: 0 } },
      { t: "I asked for a trade and I will keep asking until somebody in that building listens to me.", tone: 'fiery', fx: { fame: 3, trust: -2, chem: -2 } }
    ] },

    // Playoffs
    { k: 'po_pressure', when: 'playoffs', q: "The playoffs are here. How much pressure do you feel?", a: [
      { t: "It is a lot, but I love it, and I want my teammates to feel that energy too.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "No pressure for me. This is the stage I have been waiting my whole career for.", tone: 'confident', fx: { fame: 3, trust: 0, chem: 0 } },
      { t: "The pressure is on the other guys, because I have been ready for this since summer.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -2 } }
    ] },
    { k: 'po_opp', when: 'playoffs', q: "{opp} stands between {team} and the next round. What is your plan?", a: [
      { t: "They are a tough team, so we are going to lean on our preparation and trust each other.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "We have a plan for them, and I think we are going to surprise a lot of people.", tone: 'confident', fx: { fame: 2, trust: 1, chem: 0 } },
      { t: "Their players better be ready for a fight, because we are not going to back down.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -1 } }
    ] },
    { k: 'po_clutch', when: 'playoffs', q: "Everybody wants to see you in the clutch. Are you ready for those moments?", a: [
      { t: "I have been in those moments before, and I know my teammates will be there with me.", tone: 'humble', fx: { fame: 0, trust: 2, chem: 2 } },
      { t: "I was born for those moments, and I am ready to take the big shot when it comes.", tone: 'confident', fx: { fame: 3, trust: 0, chem: 0 } },
      { t: "Clutch is a word the media made up. I just make shots, and everybody else should be ready.", tone: 'fiery', fx: { fame: 3, trust: -1, chem: -2 } }
    ] }
  ],

  // Headline templates. Placeholders: {name} {team} {opp} {pts} {n}
  news: {
    debut: [
      "{name} makes his debut for {team} and the crowd is on its feet",
      "{name} opens his career with a bang against {opp}",
      "Debut day for {name} as {team} gets a look at its new player"
    ],
    first20: [
      "{name} erupts for {pts} in a win over {opp} and {team} takes notice",
      "{pts} points for {name} as {team} tops {opp}",
      "{name} scores {pts} against {opp}, his first big scoring night in {team} colors"
    ],
    first30: [
      "{name} tops 30 for the first time, and {opp} has no answer",
      "{name} scores {pts} in a {team} win and the rookie buzz gets louder",
      "{pts} points from {name} lifts {team} past {opp}"
    ],
    first40: [
      "{name} scores {pts} in a historic night for {team}",
      "{pts} points. {name} joins the rarest air in the league",
      "{name} goes off for {pts} and {opp} can only watch"
    ],
    tripleDouble: [
      "{name} posts a {n}-point triple-double as {team} beats {opp}",
      "Triple-double alert: {name} fills the box score in a win over {opp}",
      "{name} with {pts} points and a triple-double in a big {team} win"
    ],
    allStar: [
      "{name} named to the All-Star team, a big honor for {team}",
      "All-Star nod for {name}, and the league takes notice of {team}",
      "{name} earns a spot in the All-Star game, and {team} celebrates"
    ],
    mvp: [
      "{name} wins the MVP award and {team} fans are celebrating",
      "MVP: {name} takes the top individual honor of the season",
      "{name} takes home MVP as {team} leads the way"
    ],
    roy: [
      "{name} wins Rookie of the Year and {team} has a future cornerstone",
      "Rookie of the Year goes to {name}",
      "{name} takes Rookie of the Year honors in a season to remember for {team}"
    ],
    dpoy: [
      "{name} wins Defensive Player of the Year for {team}",
      "{name} claims DPOY, the first defensive honor of his career",
      "Defensive Player of the Year: {name} locks down the league"
    ],
    title: [
      "{team} wins the championship, and {name} is holding the trophy",
      "Champions: {team} beats {opp} to take the title",
      "{team} is king, and {name} led the way to the title"
    ],
    fmvp: [
      "{name} named Finals MVP after {team} takes the title",
      "Finals MVP {name} carries {team} to a championship",
      "{name} puts the Finals on his back and earns MVP honors"
    ],
    tradeRequest: [
      "{name} wants out of {team}, and the front office is listening",
      "Trade request from {name} shakes up {team}",
      "{name} asks for a trade, leaving {team} with a tough call"
    ],
    traded: [
      "{team} sends {name} to a new home in a blockbuster deal",
      "{name} is traded, and {team} fans say goodbye",
      "Trade complete: {name} heads out of {team}"
    ],
    signed: [
      "{name} signs with {team} in a deal that keeps him in town",
      "{team} locks up {name} with a new contract",
      "{name} agrees to terms with {team}"
    ],
    extension: [
      "{team} extends {name}, a long-term commitment to the franchise",
      "{name} signs a contract extension with {team}",
      "Big extension for {name}, and {team} fans are happy"
    ],
    injury: [
      "{name} is out with an injury, and {team} will need answers",
      "Injury update: {name} sidelined as {team} prepares for {opp}",
      "{name} hurt in the loss to {opp}, and {team} holds its breath"
    ],
    milestone1k: [
      "{name} reaches {n} career points with {team}",
      "{name} hits the 1,000-point mark in a win over {opp}",
      "1,000 points for {name}, a milestone in his young career"
    ],
    milestone10k: [
      "{name} passes {n} career points, a rare milestone",
      "10,000 points for {name}, a number few players ever reach",
      "{name} hits 10,000 career points as {team} celebrates"
    ],
    legend: [
      "{name} retires after {n} seasons as one of the greatest to wear {team}",
      "{name} hangs it up, and his number will go up in the {team} rafters",
      "{name} announces retirement after a career that changed {team}"
    ]
  },

  // Teammate and coach relationship events. Placeholders: {mate} {coach}
  rel: {
    praise: [
      { t: "{mate} tells the press you are the best teammate he has ever had", fx: { chem: 3 } },
      { t: "You hype up {mate} after a big play, and the bench goes wild", fx: { chem: 2 } },
      { t: "{coach} praises your work ethic in front of the whole team", fx: { chem: 2 } }
    ],
    beef: [
      { t: "You and {mate} get into a heated argument in practice", fx: { chem: -3 } },
      { t: "{mate} calls you out in the locker room after a bad shot", fx: { chem: -2 } },
      { t: "A quick shouting match with {mate} ends with both of you apologizing", fx: { chem: -1 } }
    ],
    mentor: [
      { t: "{mate} asks you for tips on his shooting form after practice", fx: { chem: 3 } },
      { t: "You take {mate} under your wing and walk him through the playbook", fx: { chem: 3 } },
      { t: "{coach} asks you to help bring along the young players", fx: { chem: 2 } }
    ],
    rookieHaze: [
      { t: "You join the veterans in good-natured teasing of {mate}, the rookie", fx: { chem: 1 } },
      { t: "The team makes {mate} sing his rookie song on the bus, and everyone laughs", fx: { chem: 2 } },
      { t: "You go too far with the rookie pranks, and {mate} is not happy about it", fx: { chem: -3 } }
    ],
    coachTalk: [
      { t: "{coach} pulls you aside for a long talk about your attitude", fx: { chem: 1 } },
      { t: "You push back on {coach} about a play call, then settle it in the film room", fx: { chem: -1 } },
      { t: "{coach} tells reporters you have earned more of his trust", fx: { chem: 2 } }
    ],
    benchChat: [
      { t: "You trade jokes with {mate} on the bench during a blowout", fx: { chem: 2 } },
      { t: "{mate} vents about his minutes, and you stay quiet while reporters wait nearby", fx: { chem: -1 } },
      { t: "Quiet talk with {mate} on the bench helps you both reset after a rough quarter", fx: { chem: 1 } }
    ]
  }
};

if (typeof module !== 'undefined') module.exports = { CAR_TEXT };
