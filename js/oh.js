OT = (function(){
    var OT = {};
    Array.prototype.clear = function(){
        var s = this;
        while(s.length > 0) s.shift();
    };
    Array.prototype.getRandom = function(){
        var s = this;
        var index = parseInt(Math.random() * s.length);
        return s[index];
    };
    OT.define = function(def){
        var func = def.init || function(){};
        if(def.prototype) func.prototype = new def.prototype();
        for(var key in def.property){
            if(def.property.hasOwnProperty(key)){
                func.prototype[key] = def.property[key];
            }
        }
        return func;
    };
    OT.Disk = OT.define({
        init:function(row, column){
            var s = this;
            s.row = row;
            s.column = column;
            s.put(OT.COLOR.NONE);
            s.surroundings = {};
            s.trappable = {
                dark:[],
                light:[]
            }
        },
        property:{
            put:function(color){
                var s = this;
                s.color = color;
                for(var dir in s.surroundings){
                    if(!s.surroundings.hasOwnProperty(dir)) continue;
                    var surrounding = s.surroundings[dir];
                    var COLOR = OT.COLOR;
                    switch(surrounding.color){
                        case COLOR.NONE:
                    }
                }
            },
            revert:function(){
                var s = this;
                s.color = OT.COLOR.invert(s.color);
            },
            surround:function(dir, disk){
                var s = this;
                s.surroundings[dir] = disk;
                disk.surroundings[8 - dir] = s;
            },
            isColored:function(){
                var s = this;
                return s.color === OT.COLOR.LIGHT
                    || s.color === OT.COLOR.DARK;
            },
            findTrappable:function(color){
                var s = this;
                var result = [];
                for(var dir in s.surroundings){
                    if(!s.surroundings.hasOwnProperty(dir)) continue;
                    var trappable = s.findTrappableOnDir(color, dir);
                    if(trappable && trappable.length > 0){
                        result = result.concat(trappable);
                    }
                }
                return result;
            },
            findTrappableOnDir:function(color, dir){
                var s = this;
                var disk = s.surroundings[dir];
                if(!disk || !disk.isColored()) return null;
                if(disk.color === color){

                    return [];
                } else {
                    var trappable = disk.findTrappableOnDir(color, dir);
                    if(trappable){
                        trappable.push(disk);
                        return trappable;
                    } else {
                        return null;
                    }
                }
            },
            trappableForColor:function(color){
                var s = this;
                return s.trappable[OT.COLOR.toString(color)];
            },
            getDistance:function(disk){
                var s = this;
                var r = Math.abs(s.row - disk.row),
                    c = Math.abs(s.column - disk.column);
                return r > c ? r:c;
            }
        }
    });
    OT.COLOR = {
        NONE:-1, LIGHT:3, DARK:4,
        toString:function(color){
            switch(color){
            case OT.COLOR.NONE: return "none";
            case OT.COLOR.LIGHT: return "light";
            case OT.COLOR.DARK: return "dark";
            }
            return "";
        },
        invert:function(color){
            switch (color){
                case OT.COLOR.LIGHT:
                    return OT.COLOR.DARK;
                case OT.COLOR.DARK:
                    return OT.COLOR.LIGHT;
            }
            return color;
        }
    };
    OT.DIR = {
        UL:0, U:1, UR:2,
         L:3, C:4,  R:5,
        DL:6, D:7, DR:8
        /***************
         *             *
         *  UL  U  UR  *
         *   L  C   R  *
         *  DL  D  DR  *
         *             *
         ***************/
    };
    OT.Board = OT.define({
        init:function(rows, columns){
            var s = this;
            s.disks = [];
            s.rows = rows, s.columns = columns;
            for(var row=0; row<rows; row++){
                s.disks[row] = [];
                for(var column=0; column<columns; column++){
                    var disk = new OT.Disk(row, column);
                    s.disks[row].push(disk);
                    for(var key in OT.DIR){
                        if(!OT.DIR.hasOwnProperty(key)) continue;
                        var dir = OT.DIR[key];
                        if(dir >= OT.DIR.C) continue;
                        var r = row + Math.round((dir - OT.DIR.C) / 3),
                            c = column + (dir%3 - 1);
                        if(r < 0 || c < 0) continue;
                        var surrounding = s.disks[r][c];
                        if(surrounding){
                            disk.surround(dir, surrounding);
                        }
                    }
                }
            }
            s.color = OT.COLOR.LIGHT;
            s.disks[3][3].put(OT.COLOR.LIGHT);
            s.disks[3][4].put(OT.COLOR.DARK);
            s.disks[4][3].put(OT.COLOR.DARK);
            s.disks[4][4].put(OT.COLOR.LIGHT);
            s.refresh();
        },
        property:{
            refresh:function(){
                var s = this;
                for(var row=0; row<s.disks.length; row++){
                    for(var column=0; column<s.disks[row].length; column++){
                        var disk = s.disks[row][column];
                        disk.trappable.dark.clear();
                        disk.trappable.light.clear();
                        if(!disk.isColored()){
                            disk.trappable.dark = disk.findTrappable(OT.COLOR.DARK);
                            disk.trappable.light = disk.findTrappable(OT.COLOR.LIGHT);
                        }
                    }
                }
            },
            turn:function(){
                var s = this;
                s.color = OT.COLOR.invert(s.color);
            },
            getScore:function(){
                var s = this;
                var score = {light:0, dark:0};
                for(var row=0; row<s.disks.length; row++){
                    for(var column=0; column<s.disks[row].length; column++){
                        var disk = s.disks[row][column];
                        switch(disk.color){
                            case OT.COLOR.DARK:
                                score.dark++;
                                break;
                            case OT.COLOR.LIGHT:
                                score.light++;
                                break;
                        }
                    }
                }
                return score;
            },
            getAvailableDisks:function(color){
                var s = this;
                var color = OT.COLOR.toString(s.color);
                var result = [];
                for(var row=0; row< s.disks.length; row++){
                    for(var column=0; column< s.disks[row].length; column++){
                        var disk = s.disks[row][column];
                        if(disk.trappable[color].length > 0){
                            result.push(disk);
                        }
                    }
                }
                return result;
            },
            isEmptyDisk:function(row, column){
                var s = this;
                var disk = s.getDisk(row, column);
                if(!disk) return null;
                return disk.color === OT.COLOR.NONE;
            },
            getDisk:function(row, column){
                var s = this;
                if(row < 0 || row >= s.rows) return null;
                if(column < 0 || column >= s.columns) return null;
                return s.disks[row][column];
            }
        }
    });
    OT.Ai = OT.define({
        init:function(color){
            var s = this;
            s.color = color;
        },
        property:{
            nextMove:function(board){
                var s = this;
                var choices = board.getAvailableDisks(s.color);

                var rows = board.rows, columns = board.columns;
                var corners = s._findCorner(choices, rows, columns);
                if(corners.length > 0) return corners.getRandom();

                var sanded = s._findSanded(choices, board);
                if(sanded.length > 0) {
                    return sanded.getRandom();
                }

                var safeChoices = s._findSafeChoice(choices, board);
                if(safeChoices.length > 0) choices = safeChoices;

                var maxTrap = s._findMaxTrap(choices);
                if(maxTrap.length === 1) return maxTrap[0];

                var end = s._findEnd(maxTrap, rows, columns);
                if(end.length > 0){
                    return end.getRandom();
                }

                var endAim = s._findEndAim(maxTrap, rows, columns);
                if(endAim.length > 0){
                    return endAim.getRandom();
                }

                return maxTrap.getRandom();
            },
            _findSanded:function(choices, board){
                var result = [];
                var s = this;
                function isOpponent(row, column){
                    var disk = board.getDisk(row, column);
                    return disk && disk.color === OT.COLOR.invert(s.color);
                }
                for(var i=0; i<choices.length; i++){
                    var disk = choices[i];
                    var r = disk.row, c = disk.column;
                    var isSanded = (isOpponent(r-1, c) && isOpponent(r+1, c))
                        || (isOpponent(r, c-1) && isOpponent(r, c+1));
                    if(isSanded){
                        result.push(disk);
                    }
                }
                return result;
            },
            _findEndAim:function(choices, rows, columns){
                var result = [];
                for(var i=0; i<choices.length; i++){
                    var disk = choices[i];
                    var r = disk.row, c = disk.column;
                    var isEndAimR = (r < 4 && r % 2 === 0)
                        || (r >= 4 && r % 2 === 1);
                    var isEndAimC = (c < 4 && c % 2 === 0)
                        || (c >= 4 && c % 2 === 1);
                    if(isEndAimR && isEndAimC){
                        result.push(disk);
                    }

                }
                return result;
            },
            _findEnd:function(choices, rows, columns){
                var result = [];
                for(var i=0; i<choices.length; i++){
                    var disk = choices[i];
                    var r = disk.row, c = disk.column;
                    var isEnd = r === 0
                        || r === rows - 1
                        || c === 0
                        || c === columns - 1;
                    if(isEnd){
                        result.push(disk);
                    }
                }
                return result;
            },
            _findCorner:function(choices, rows, columns){
                var result = [];
                for(var i=0; i<choices.length; i++){
                    var disk = choices[i];
                    var r = disk.row, c = disk.column;
                    var isCorner = (r === 0 || r === rows-1)
                        && (c === 0 || c === columns-1);
                    if(isCorner) result.push(disk);
                }
                return result;
            },
            _findSafeChoice:function(choices, board){
                var result = [];
                var dangers = [];
                var minR = 0, minC = 0,
                    maxR = board.rows - 1, maxC = board.columns - 1;
                if(board.isEmptyDisk(minR, minC)){
                    dangers.push({r:minR, c:minC+1});
                    dangers.push({r:minR+1, c:minC});
                    dangers.push({r:minR+1, c:minC+1});
                }
                if(board.isEmptyDisk(minR, maxC)){
                    dangers.push({r:minR, c:maxC-1});
                    dangers.push({r:minR+1, c:maxC});
                    dangers.push({r:minR+1, c:maxC-1});
                }
                if(board.isEmptyDisk(maxR, minC)){
                    dangers.push({r:maxR, c:minC+1});
                    dangers.push({r:maxR-1, c:minC});
                    dangers.push({r:maxR-1, c:minC+1});
                }
                if(board.isEmptyDisk(maxR, maxC)){
                    dangers.push({r:maxR, c:maxC-1});
                    dangers.push({r:maxR-1, c:maxC});
                    dangers.push({r:maxR-1, c:maxC-1});
                }
                function isDanger(r, c){
                    for(var i=0; i<dangers.length; i++){
                        var danger = dangers[i];
                        if(danger.r === r && danger.c === c){
                            return true;
                        }
                    }
                    return false;
                }


                for(var i=0; i<choices.length; i++){
                    var disk = choices[i];
                    if(isDanger(disk.row, disk.column)){
                    } else {
                        result.push(disk);
                    }
                }
                return result;
            },
            _findMaxTrap:function(choices){
                var s = this;
                var result = [];
                var color = OT.COLOR.toString(s.color);
                for(var i=0; i< choices.length; i++){
                    var disk = choices[i];
                    var length = disk.trappable[color].length;
                    if(length === 0) continue;
                    if(result.length === 0){
                        result.push(disk);
                    } else {
                        var max = result[0].trappable[color].length;
                        if(max < length){
                            result.clear();
                            result.push(disk);
                        } else if(max === length){
                             result.push(disk);
                        }
                    }
                }
                return result;
            }
        }
    });
    return OT;
})();