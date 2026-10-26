// Original demo notes prepared for this prototype. These are not excerpts from an uploaded book.
export const courses = [
  { id: 'biology', name: 'Life, at the smallest scale', subject: 'BIOLOGY', color: 'green', symbol: 'leaf', description: 'Small structures. Remarkable systems.', chapters: [
    { id: 'membranes', title: 'Across the cell membrane', topic: 'Cell transport', read: 'A boundary that knows what to let through.', notes: [
      'The phospholipid bilayer forms a selectively permeable boundary. Small, nonpolar molecules can cross relatively easily; ions and many polar molecules need transport proteins.',
      'Passive transport moves substances down their concentration gradient without directly using cellular energy. Facilitated diffusion uses a protein, but is still passive.',
      'Active transport uses energy to move substances against a concentration gradient. Osmosis is the net movement of water across a selectively permeable membrane toward the side with a higher effective concentration of nonpenetrating solute.'
    ], questions: [
      { id:'b1', prompt:'Glucose moves through a membrane protein from higher to lower concentration. Which process is this?', options:['Active transport','Facilitated diffusion','Osmosis'], answer:1, topic:'Facilitated diffusion', source:1, why:'Using a protein does not make transport active. The direction is down the concentration gradient, so this is facilitated diffusion.', nudge:'Separate the route from the energy requirement: a protein is a route, not proof of active transport.' },
      { id:'b2', prompt:'Which molecule crosses the phospholipid bilayer most easily without a transport protein?', options:['A sodium ion','A large protein','A small, nonpolar molecule'], answer:2, topic:'Selective permeability', source:0, why:'The membrane’s interior favors small, nonpolar molecules. Charged ions and large molecules face a much greater barrier.', nudge:'Focus on size and charge, rather than whether a substance is useful to the cell.' },
      { id:'b3', prompt:'A pump moves ions from lower to higher concentration. What does this require?', options:['An energy source','Only a membrane opening','Water moving in the opposite direction'], answer:0, topic:'Active transport', source:2, why:'Moving against a concentration gradient requires energy. A channel alone would not maintain this uphill movement.', nudge:'Picture the concentration gradient as a slope. Moving uphill needs an energy source.' },
    ] },
    { id:'enzymes', title:'A little help from enzymes', topic:'Reaction rates', read:'Same destination. An easier path.', notes:[
      'An enzyme is a biological catalyst. It increases reaction rate by lowering the activation energy needed to reach the transition state.',
      'An enzyme is not consumed by the reaction it catalyzes. It does not change the reaction’s overall free-energy difference or equilibrium position.',
      'The active site binds suitable substrates. Changes in temperature or pH can affect an enzyme’s shape and activity; sufficiently extreme conditions can denature it.'
    ], questions:[
      {id:'b4',prompt:'How does an enzyme speed up a reaction?',options:['It changes the equilibrium position','It lowers activation energy','It is consumed to provide all the energy'],answer:1,topic:'Activation energy',source:0,why:'An enzyme provides a pathway with a lower activation-energy barrier. It does not change the reaction’s thermodynamic destination.',nudge:'Separate how quickly a reaction proceeds from where its equilibrium lies.'},
      {id:'b5',prompt:'After catalyzing one reaction, an enzyme can usually…',options:['Catalyze another reaction','Become a permanent part of the product','Reverse the reaction’s overall free-energy change'],answer:0,topic:'Catalyst reuse',source:1,why:'Catalysts are regenerated rather than consumed in the overall reaction, so the enzyme can act again.',nudge:'A catalyst helps the process without being used up as a reactant.'},
      {id:'b6',prompt:'Why can extreme pH reduce enzyme activity?',options:['It always removes every substrate','It guarantees a faster collision rate','It can disrupt the enzyme’s shape'],answer:2,topic:'Enzyme structure',source:2,why:'Changes in charge and interactions can disrupt the active site’s structure and its ability to bind or catalyze.',nudge:'Think about how structure supports function at the active site.'},
    ] },
  ] },
  { id:'statistics',name:'Finding the signal',subject:'STATISTICS',color:'blue',symbol:'chart',description:'Good questions meet useful evidence.',chapters:[
    {id:'center',title:'What does “typical” mean?',topic:'Center & spread',read:'One number never tells the whole story.',notes:[
      'The arithmetic mean is the sum of observations divided by their count. Each observation contributes to the result, so an extreme value can shift the mean substantially.',
      'The median is the middle value in ordered data, or the average of the two middle values for an even count. It is less sensitive than the mean to extreme values.',
      'The interquartile range is Q3 minus Q1. It describes the spread of the middle 50% of observations, rather than the entire range.'
    ],questions:[
      {id:'s1',prompt:'For the values 2, 3, 4, 5, 100, what is the median?',options:['4','22.8','100'],answer:0,topic:'Median',source:1,why:'The ordered list has five values. Its middle, third value is 4.',nudge:'The median is about position in the ordered list, not the total divided by the count.'},
      {id:'s2',prompt:'One very high salary is added to a small salary dataset. Which measure is generally more sensitive?',options:['The median','The mean','Neither can change'],answer:1,topic:'Outlier sensitivity',source:0,why:'The mean uses the size of every value. An extreme addition can pull it upward more than the median.',nudge:'Ask which calculation directly adds the extreme value into its total.'},
      {id:'s3',prompt:'What does the interquartile range describe?',options:['The largest minus the smallest value','The average observation','The spread of the middle 50%'],answer:2,topic:'Interquartile range',source:2,why:'Q3 minus Q1 measures the width of the central half of the ordered data.',nudge:'“Interquartile” points to the interval between the first and third quartiles.'},
    ]},
    {id:'sampling',title:'From sample to population',topic:'Sampling',read:'Who is missing from the picture?',notes:[
      'A population is the full group of interest. A sample is the subset actually observed. The sampling process affects how well a sample represents its population.',
      'A large sample can still be biased. Increasing sample size reduces random sampling variability under suitable sampling conditions, but does not automatically correct systematic selection bias.',
      'Random sampling and random assignment serve different purposes. Sampling concerns whom we observe; assignment concerns which treatment study participants receive.'
    ],questions:[
      {id:'s4',prompt:'A survey of website visitors is used to describe all residents. The biggest concern is…',options:['Residents who never visit the website are excluded','Every sample is automatically representative','The survey has too many answers'],answer:0,topic:'Selection bias',source:0,why:'Website visitors may systematically differ from other residents, so the observation process can miss important groups.',nudge:'Start with who could enter the sample and who could not.'},
      {id:'s5',prompt:'Does collecting more responses from the same biased source necessarily remove selection bias?',options:['Yes, once there are 1,000 responses','No','Yes, if the mean is calculated'],answer:1,topic:'Size versus bias',source:1,why:'More data from the same systematically selective process can preserve the bias.',nudge:'More precision around a biased result does not make it representative.'},
      {id:'s6',prompt:'Random assignment determines…',options:['Which population we care about','Which residents enter a survey','Which treatment a participant receives'],answer:2,topic:'Assignment versus sampling',source:2,why:'Assignment allocates participants to treatments. Sampling selects people from a population.',nudge:'Identify the decision being randomized: entry into the study or treatment within it.'},
    ]},
  ]},
  {id:'computing',name:'Thinking in systems',subject:'COMPUTER SCIENCE',color:'amber',symbol:'code',description:'Build a clearer mental model.',chapters:[
    {id:'search',title:'Finding what you need',topic:'Search algorithms',read:'A useful shortcut starts with an assumption.',notes:[
      'Linear search checks items one at a time until it finds a match or reaches the end. Its worst-case number of checks grows proportionally with the list length.',
      'Binary search repeatedly halves the candidate interval in sorted data. Its worst-case number of comparisons grows logarithmically with the number of elements.',
      'Binary search relies on an ordering that supports discarding one half of the remaining interval. Applying it to an arbitrary unsorted list does not guarantee a correct result.'
    ],questions:[
      {id:'c1',prompt:'What must hold for ordinary binary search on an array?',options:['All values must be identical','The array must be appropriately sorted','The array must contain fewer than ten items'],answer:1,topic:'Binary search precondition',source:2,why:'Ordering makes it safe to eliminate half the candidates after a comparison.',nudge:'A shortcut is valid only when its assumption is satisfied.'},
      {id:'c2',prompt:'In the worst case, doubling a list’s length roughly doubles the checks for…',options:['Linear search','Binary search','Neither search'],answer:0,topic:'Linear growth',source:0,why:'Linear search may need to inspect every element, so its worst-case work is proportional to list length.',nudge:'Think about the case where the target is absent.'},
      {id:'c3',prompt:'What happens to the candidate interval after a typical binary-search comparison?',options:['It doubles','It always loses only one item','It is roughly halved'],answer:2,topic:'Halving the search space',source:1,why:'The comparison and ordering allow one half of the interval to be discarded.',nudge:'The speedup comes from eliminating many candidates at once.'},
    ]},
    {id:'state',title:'Remembering a changing world',topic:'State & persistence',read:'What survives when the page closes?',notes:[
      'Application state is information used to represent the current situation, such as the selected course or current question. State held only in memory is usually lost when the page reloads.',
      'Browser local storage can preserve small amounts of data across reloads on the same origin and browser profile. It does not automatically synchronize data across devices.',
      'Data read from storage may be missing, malformed, or from an older version. Validate its shape and handle failure instead of assuming it is always usable.'
    ],questions:[
      {id:'c4',prompt:'A question selection exists only in component memory. What usually happens after a full page reload?',options:['It automatically syncs to all devices','It is always encrypted and backed up','It is lost unless restored from another source'],answer:2,topic:'In-memory state',source:0,why:'Reloading starts a new application instance. In-memory state must be reconstructed.',nudge:'Distinguish temporary working state from a durable saved record.'},
      {id:'c5',prompt:'Does browser local storage automatically sync study progress to a different device?',options:['Yes','No','Yes, when the browser is restarted'],answer:1,topic:'Local persistence',source:1,why:'Local storage belongs to an origin and browser profile. Cross-device sync needs an additional system.',nudge:'Local persistence and account synchronization are different capabilities.'},
      {id:'c6',prompt:'What is a good first step when loading a saved session?',options:['Validate its structure and handle missing data','Assume every property exists','Send it to every connected service'],answer:0,topic:'Storage validation',source:2,why:'Validation helps the app recover safely from old, incomplete, or damaged records.',nudge:'Treat saved state as input that may not match your current expectations.'},
    ]},
  ]},
]
export const findChapter = (id) => courses.flatMap(c => c.chapters).find(c => c.id === id)
export const findQuestion = (id) => courses.flatMap(c => c.chapters.flatMap(ch => ch.questions)).find(q => q.id === id)
export const chapterForQuestion = (id) => courses.flatMap(c => c.chapters).find(ch => ch.questions.some(q => q.id === id))
