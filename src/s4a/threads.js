var port2 = ' '
var datareturn = ' '
Process.prototype.connectArduino = function (port) {
    var sprite = this.blockReceiver();

    if (!sprite.arduino.connecting) {
        sprite.arduino.connecting = true;
        if (sprite.arduino.board === undefined) {
            if (port.indexOf('tcp://') === 0) {
                sprite.arduino.connectNetwork(port.slice(6));
            } else {
                // Second parameter tells `connect` to verify port before connecting
                // Since one can enter arbitrary text in this block, it is important
                // to do so!
                sprite.arduino.connect(port, true);
            }
        }
    }

    if (sprite.arduino.justConnected) {
        sprite.arduino.justConnected = undefined;
        return;
    }

    if (sprite.arduino.board && sprite.arduino.board.connected) {
        return;
    }

    this.pushContext('doYield');
    this.pushContext();
};
Process.prototype.conectarPlaca = function (port) {
    var sprite = this.blockReceiver();
    const SerialPort = require("browser-serialport").SerialPort 
    if(sprite.arduino.port != port){
        sprite.arduino.serial = new SerialPort(port, {
            baudrate: 57600
           }, false); 
           sprite.arduino.serial.open(function (error) {
        if ( error ) {
            console.log('failed to open: '+error);
            sprite.arduino.port = ' '
        } else {
            sprite.arduino.port = port
            console.log('open');
        }
        });
    }
};
Process.prototype.enviarDado = function (port) {
    var sprite = this.blockReceiver();
    if(sprite.arduino.port != ' '){
        sprite.arduino.serial.write(port, function(err, results) {
            sprite.arduino.serial.on('data', function(data) {
            });
          });
    }
};
Process.prototype.LedDados = function (port) {
    var sprite = this.blockReceiver();
    if(sprite.arduino.port != ' '){
    if(port2 != port){
    if(datareturn == ' '){
        sprite.arduino.serial.write(port, function(err, results) {
            sprite.arduino.serial.on('data', function(data) {
                port2 = port
                datareturn = data
            });
            });
    }
    }else{
        sprite.arduino.serial.write(port, function(err, results) {
            sprite.arduino.serial.on('data', function(data) {
                this.datareturn = data
            });
          });
        return datareturn
    }
   }
};


Process.prototype.disconectartArduino = function (port) {
    var sprite = this.blockReceiver();
        if(sprite.arduino.port != ' '){
        sprite.arduino.port = ' ';
        sprite.arduino.serial.close(function(err){
            console.log('failed to open: '+err);
          });
    }       
};
Process.prototype.conectado = function (port) {
    var sprite = this.blockReceiver();
    if(sprite.arduino.port != ' '){
        return true;
    }else{
        return false;
    }        
};
 

Process.prototype.conectadoPlaca = function (port) {
    var sprite = this.blockReceiver();
    const SerialPort = require("browser-serialport").SerialPort 
    if(sprite.arduino.port == port){
        return true;
    }else{
        if(sprite.arduino.port != port){          
            sprite.arduino.serial = new SerialPort(port, {
                baudrate: 57600
               }, false); 
               sprite.arduino.serial.open(function (error) {
                  if ( error ) {
                    console.log('failed to open: '+error);
                     sprite.arduino.port = ' '
                 } else {
                    console.log('Open: ');
                    sprite.arduino.port = port
                 }
            });
        }
    }        
};
Process.prototype.disconnectArduino = function (port) {
    var sprite = this.blockReceiver();

    if (sprite.arduino.board && sprite.arduino.board.connected) {
        sprite.arduino.disconnect(true); // silent
    }
};

Process.prototype.setPinMode = function (pin, mode) {
    var sprite = this.blockReceiver();

    if (sprite.arduino.isBoardReady()) {

        var board = sprite.arduino.board, 
            val;

        switch(mode[0]) {
            case 'digital input': val = board.MODES.INPUT; break;
            case 'digital output': val = board.MODES.OUTPUT; break;
            case 'PWM': val = board.MODES.PWM; break;
            case 'servo': val = board.MODES.SERVO; break;
            case 'analog input': val = board.MODES.ANALOG; break;
        }

        if (this.context.pinSet === undefined) {
            if (board.pins[pin].supportedModes.indexOf(val) > -1) {	
                board.pinMode(pin, val);
            } else { 
                return null;
            }
        }

        if (board.pins[pin].mode === val) {
            this.context.pinSet = true;
            return null;
        }

        this.pushContext('doYield');
        this.pushContext();
    } else {
        throw new Error(localize('Arduino not connected'));	
    }
};

Process.prototype.servoWrite = function (pin, value) {
    var sprite = this.blockReceiver();

    this.popContext();
    sprite.startWarp();
    this.pushContext('doYield');

    if (!this.isAtomic) {
        this.pushContext('doStopWarping');
    }

    if (sprite.arduino.isBoardReady()) {

        var board = sprite.arduino.board,
            numericValue;

        if (value[0] == 'disconnected') {
            if (board.pins[pin].mode != board.MODES.OUTPUT) {
                board.pinMode(pin, board.MODES.OUTPUT);
            }
            this.isAtomic = true;
            this.pushContext();
            return null;
        }

        if (board.pins[pin].mode != board.MODES.SERVO) {
            board.pinMode(pin, board.MODES.SERVO);
            board.servoConfig(pin, 600, 2400);
        }

        switch (value[0]) {
            case 'clockwise':
                numericValue = 1200;
                break;
            case 'counter-clockwise':
                numericValue = 1800;
                break;
            case 'stopped':
                numericValue = 1500;
                break;
            default:
                numericValue = value;
        }
        board.servoWrite(pin, numericValue);
        this.isAtomic = true;
        this.pushContext();
        return null;
    } else {
        throw new Error(localize('Arduino not connected'));			
    }

    this.isAtomic = true;
    this.pushContext();
};

Process.prototype.reportAnalogReading = function (pin) {
    var sprite = this.blockReceiver();

    if (sprite.arduino.isBoardReady()) {

        var board = sprite.arduino.board; 

        if (board.pins[board.analogPins[pin]].mode != board.MODES.ANALOG) {
            board.pinMode(board.analogPins[pin], board.MODES.ANALOG);
        } else {
            return board.pins[board.analogPins[pin]].value;
        }

        this.pushContext('doYield');
        this.pushContext();
    } else {
        throw new Error(localize('Arduino not connected'));	
    }
};

Process.prototype.reportDigitalReading = function (pin) {
    var sprite = this.blockReceiver();

    if (sprite.arduino.isBoardReady()) {

        var board = sprite.arduino.board; 

        if (board.pins[pin].mode != board.MODES.INPUT) {
            board.pinMode(pin, board.MODES.INPUT);
            board.reportDigitalPin(pin, 1);
        } else {
            return board.pins[pin].value == 1;
        }

        this.pushContext('doYield');
        this.pushContext();
    } else {
        throw new Error(localize('Arduino not connected'));		
    }
};

Process.prototype.digitalWrite = function (pin, booleanValue) {
    var sprite = this.blockReceiver();

    if (sprite.arduino.isBoardReady()) {
        var board = sprite.arduino.board,
            val = booleanValue ? board.HIGH : board.LOW;

        if (board.pins[pin].mode != board.MODES.OUTPUT) {
            board.pinMode(pin, board.MODES.OUTPUT);
        }
        board.digitalWrite(pin, val);
        this.doWait(0);
    } else {
        throw new Error(localize('Arduino not connected'));
    }

};

Process.prototype.pwmWrite = function (pin, value) {
    var sprite = this.blockReceiver();

    if (sprite.arduino.isBoardReady()) {
        var board = sprite.arduino.board; 

        if (board.pins[pin].mode != board.MODES.PWM) {
            board.pinMode(pin, board.MODES.PWM);
        }
        board.analogWrite(pin, value);
        this.doWait(0);
    } else {
        throw new Error(localize('Arduino not connected'));
    }
};

Process.prototype.reportConnected = function () {
    var sprite = this.blockReceiver();
    return sprite.arduino.isBoardReady();
};
