export const building={
  bounds:{w:64,d:46},spawn:{x:-16,z:0},
  rooms:[
    {name:'ARCADE HALL',x:-16,z:-12,w:32,d:20,floor:'#493348',line:'#62435d'},
    {name:'LIBRARY + FILES',x:16,z:-12,w:32,d:20,floor:'#4c4332',line:'#655a43'},
    {name:'ORBIT LOUNGE',x:-16,z:12,w:32,d:20,floor:'#263f49',line:'#345662'},
    {name:'SYSTEM WORKSHOP',x:16,z:12,w:32,d:20,floor:'#30394b',line:'#404d66'},
    {name:'MAIN CORRIDOR',x:0,z:0,w:64,d:4,floor:'#5b5860',line:'#747078'}
  ],
  walls:[
    [-32,-23,32,.5],[-32,23,32,.5],[-32,0,.5,23],[32,0,.5,23],
    // Wide, visible room doors: the building should invite direct exploration,
    // not force players to discover an invisible corridor route.
    [0,-18,.5,4],[0,18,.5,4],
    [-25.5,-2,6.5,.5],[0,-2,13,.5],[25.5,-2,6.5,.5],
    [-25.5,2,6.5,.5],[0,2,13,.5],[25.5,2,6.5,.5]
  ],
  furniture:[
    {type:'rug',x:-16,z:-12,w:18,d:12,color:'#633952'},{type:'counter',x:-16,z:-20,w:12,d:1.6,color:'#7c5238'},
    {type:'vending',x:-29,z:-17,color:'#a94b45'},{type:'vending',x:-29,z:-12,color:'#3c7288'},{type:'stool',x:-10,z:-18},{type:'stool',x:-7,z:-18},
    {type:'shelf',x:5,z:-18,w:7,color:'#765638'},{type:'shelf',x:13,z:-18,w:7,color:'#765638'},{type:'shelf',x:21,z:-18,w:7,color:'#765638'},
    {type:'file',x:29,z:-18,color:'#7d765f'},{type:'file',x:29,z:-13,color:'#7d765f'},{type:'file',x:29,z:-8,color:'#7d765f'},
    {type:'table',x:16,z:-10,w:8,d:4,color:'#836340'},{type:'chair',x:12,z:-10,ry:1.57},{type:'chair',x:20,z:-10,ry:-1.57},
    {type:'plant',x:4,z:-5},{type:'plant',x:28,z:-5},
    {type:'rug',x:-16,z:12,w:18,d:12,color:'#28546a'},{type:'couch',x:-27,z:15,ry:1.57,color:'#6d494a'},{type:'couch',x:-16,z:20,color:'#6d494a'},
    {type:'table',x:-16,z:13,w:7,d:3,color:'#684a35'},{type:'speaker',x:-27,z:5},{type:'speaker',x:-5,z:5},{type:'record',x:-6,z:17},
    {type:'lamp',x:-25,z:20},{type:'lamp',x:-7,z:20},{type:'plant',x:-28,z:7},
    {type:'rug',x:16,z:12,w:20,d:12,color:'#344c70'},{type:'desk',x:7,z:7,ry:0},{type:'desk',x:17,z:7,ry:0},{type:'desk',x:27,z:7,ry:0},
    {type:'server',x:29,z:17},{type:'server',x:24,z:20},{type:'server',x:18,z:20},{type:'workbench',x:7,z:18},{type:'chair',x:7,z:14,ry:3.14},
    {type:'crate',x:11,z:20},{type:'crate',x:13,z:19},{type:'plant',x:29,z:5}
  ],
  stations:[
    {id:'files',name:'MY LIBRARY',x:27,z:-11,kind:'file',route:'/pages/files.html?path=My%20Library'},
    {id:'writer',name:'WRITER DESK',x:16,z:-10,kind:'book',route:'/user-apps/productivity/writer-desk/index.html'},
    {id:'orbit',name:'RADIO ORBIT',x:-16,z:9,kind:'orbit',action:'orbit'},
    {id:'browse',name:'BROWSE',x:7,z:7,kind:'terminal',route:'/pages/browse.html'},
    {id:'relay',name:'RELAY',x:17,z:7,kind:'terminal',action:'relay'},
    {id:'settings',name:'SETTINGS',x:27,z:7,kind:'terminal',route:'/pages/settings.html'},
    {id:'board',name:'PROJECT BOARD',x:7,z:18,kind:'terminal',route:'/pages/utility-desk.html#project-board'},
    {id:'weather',name:'WEATHER',x:18,z:18,kind:'terminal',route:'/user-apps/utilities/weather-station/index.html'}
  ]
};
