(function (root, module) {
   
  
    if (typeof define === 'function' && define.amd) {

        define( module );
        
    } else if ( ( typeof require !== 'undefined' ) && (typeof exports === 'object') ) {
        
        module.exports = module;
    } else {
      
      root.Kiosk = module;
    }
    
}( this, (function ( ) {
  'use strict';

  var topics = {},
  
  push = Array.prototype.push,
  pop = Array.prototype.pop,
  toString = Object.prototype.toString,
  isArray = Array.isArray || function ( o ) {
    return toString.call( o ) === '[object Array]';
  };
  
  

  /* get/create publishing moderator */
  function getModerator ( strTopic ) {
    var oModerator;
    
    if ( typeof strTopic !== 'string' ) {
      throw new TypeError();
    }
    
    if ( typeof ( oModerator = topics[ strTopic ] ) === 'undefined' || oModerator === null ) {
      
      oModerator = topics[ strTopic ] = ( function ( strTopic ) {
        
        var topic = strTopic,
        callbacks = [ ],
        messages = [ ],
        subscribers = [],
        
        delay = 60,
        timer;
        
        function registerSubscriber( oSubscriber ) {
          subscribers.push( oSubscriber );
          return oSubscriber;
        }
        
        function unregisterSubscriber( oSubscriber ) {
          var i = -1,
          max = subscribers.length;
          
          while ( subscribers[ ++i ] !== oSubscriber && i < max ){}
          return i < max ? subscribers.slice( i, 1 )[0] : null;
        }
        
        function addCallback( fnCallback, oSubscriber ) {
          var i = -1;
            
          if ( typeof oSubscriber === 'undefined' || oSubscriber === null )  {
            throw new SyntaxError();
          }
          
          if ( typeof oSubscriber.push !== 'function' ) {
            throw new TypeError();
          }
            
          while ( callbacks[ ++i ] ){}
          oSubscriber.push( ( ( callbacks[ i ] = fnCallback ).uid = i + 1 ) );
          return oSubscriber;
        }
        
        function removeCallbacks( oSubscriber ) {
          var id;
          if ( typeof oSubscriber === 'undefined' || oSubscriber === null ) {
            throw new SyntaxError(); 
          }
          
          if ( typeof oSubscriber.pop !== 'function' ) {
            throw new TypeError();
          }
          
          while ( ( id = oSubscriber.pop() ) ) {
            callbacks[ id - 1 ] = void 0;
          }
        }
        
        function archiveMessage( oMessage ) {
          messages.push( oMessage );
        }
        
        function takeMessages( ) {
          var pkg = messages;
          messages = [];
          return pkg;
        }
        
        function distributeMessages ( ) {
          var i = 0,
          pkg = takeMessages(),
          max = callbacks.length,
          bucket;
      
          if ( pkg.length > 0 ) {
            for (; i < max; ++i ) {
              if ( typeof ( bucket = callbacks[ i ] ) === 'function' ) {
                setTimeout( bucket.apply(bucket, pkg), 0 );
              }
            }
          }
            
          return pkg;
        }
        
        function setBroadcastDelay ( msDelay ) {
          delay = msDelay;
        }
        
        function stopBroadcast() {
          clearInterval( timer );
        }
        function startBroadcast( ) {
          stopBroadcast();
          timer = setTimeout( (function ( ) {
            timer = setInterval( distributeMessages, delay );
          }), delay );
        }
        
        /* init */
        startBroadcast();
        
        return {
          
          /* topic being moderated */
          '_topic': topic,
          
          /* register observer/subscriber */
          'unregisterSubscriber': unregisterSubscriber,
          
          /* unregister subscriber */
          'registerSubscriber': registerSubscriber,
          
          /* adds new callback fnCallback ( package ), must assoc with a subscriber */
          'addCallback': addCallback,
          
          /* remove subscriber associated callbacks */
          'removeCallbacks': removeCallbacks,
          
          /* archive message in moderator for later retrieval */
          'archiveMessage': archiveMessage,
          
          /* wipe and retrieve current messages */
          'takeMessages': takeMessages,
          
          /* call fnCallbacks with current messages */
          'distribute': distributeMessages,
          
          /* starts timed broadcasting */
          'startBroadcast': startBroadcast,
          
          /* stops timed broadcasting */
          'stopBroadcast': stopBroadcast,
          
          /* set delay between broadcasts */
          'setBroadcastDelay': setBroadcastDelay
          
        };
        
      }( strTopic ) );
    }
    
   return oModerator;
  }

  /* subscribe to channel, triggers fnCallback, subscription owner */
  function subscribe ( strTopic, fnCallback /*, subscriber*/ ) {
    var oModerator;
    
    if ( typeof fnCallback !== 'function'  ) {
      throw new SyntaxError();
    }
    
    /* notify moderator of observer and, return it */
    return ( oModerator = getModerator( strTopic ) ).addCallback( fnCallback,
    ( function ( obj ) {
      
      /* Oberver/Subscriber */
      
      var moderator = oModerator,
      cbIds = [ ],
      pushId = push.bind( cbIds ),
      popId = pop.bind( cbIds ),
      interfaceSubs = {
        
        'getModerator': function () {
          return moderator;
        },
        'addCallback': function ( fnCallback ) {
          console.log(moderator);
          moderator.addCallback( fnCallback, this );
        },
        
        'push': pushId,
        'pop': popId,
        
        'destroy': function ( ) {
          var prop;
          
          moderator.removeCallbacks( this );
          moderator = cbIds = void 0;
          
          for ( prop in this ) {
            delete this[ prop ];
          }
          
        }
      },
      prop;
      
      if ( typeof obj === 'undefined' || obj === null ) {
        
        obj = interfaceSubs;
        
      } else {
        
        for ( prop in interfaceSubs ) {
          obj[ prop ] = interfaceSubs[ prop ];
        }
        
      }

      return moderator.registerSubscriber( obj );
      
    }( arguments[2] )) );
  }
  
  /* unsubscribe */
  function unsubscribe ( oSubscriber ) {
    var oModerator;
    
    if ( typeof oSubscriber === 'undefined' || oSubscriber === null ) {
      throw new TypeError();
    }
    
    if ( typeof ( oModerator = oSubscriber.getModerator() ) === 'undefined' ||  oModerator === null ) {
      throw new SyntaxError();
    }
    
    if ( ( oSubscriber = oModerator.unregisterSubscriber( oSubscriber ) ) ) {
      oSubscriber.destroy();
    }
    return !!oSubscriber;
  }
  
  /* broadcast */
  function publish ( strTopic, oMessage ) {
    getModerator( strTopic ).archiveMessage( oMessage );
  } 

   /* forces moderator to broadcast msgs to subscribers */
  function trigger ( strTopic, oMessage, fnCallback ) {
    var oModerator, pkg;
    
    pkg = ( oModerator = getModerator( strTopic ) ).distributeMessages();
    oMessage || pkg.push( oMessage );
    
    if ( typeof fnCallback !== 'undefined' ) {
      if ( typeof fnCallback !== 'function' ) {
        throw new TypeError();
      }
      setTimeout( fnCallback.apply(fnCallback, pkg ), 0 );
    }
    
  }

  /* adds a callback to the subscriber */
  function addToSubscriber( oSubscriber,  fnCallback ) {
    var oModerator;
    return ( oModerator = oSubscriber.getModerator() ) ? oModerator.addCallback( fnCallback, oSubscriber ) : null;
  }
  
  return {
    
    'publish': publish,
    'trigger': trigger,
    
    'extend': addToSubscriber,
    
    'subscribe': subscribe,
    'on': subscribe,
    
    'unsubscribe': unsubscribe,
    'off': unsubscribe
    
  };
 
}( ))));