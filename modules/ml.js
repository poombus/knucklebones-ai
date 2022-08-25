const tools = require('./tools');
const util = require('util');
const fs = require('fs');

let isTraining = false;
let session = new Date().getTime();

const conf = {
    "saveSnapshotEvery": 50,
    "chanceToAddSynapseLayer": 0.9,
    "chanceToAddNode": 0.9,
    "maxWeightDeviation": 0.1
}

let generation = 0;
let numPerGen;
let childInputs;
let childOutputs;
let family = [];

function beginTraining(data = {}, num = 100, inputs = 1, outputs = 1) {
    if (isTraining) return;
    numPerGen = num;
    childInputs = inputs;
    childOutputs = outputs;
    isTraining = true;
    if (typeof data != 'object', data = {});
    generation = -1;
    family = [];

    if (JSON.stringify(data) == '{}') newGeneration([]);
}

function newGeneration(parents = []) {
    generation++;
    family = [];
    if (parents.length > 0) { //parents given. random mutations based on parents
        let childrenPerParent = Math.ceil((numPerGen-parents.length)/parents.length);
        for (p of parents) {
            for (let c=0; c<childrenPerParent; c++) family.push(createChild(p));
        }
        for (p of parents) {
            family.push(p);
        }
    } else { //no parents (lol). completely random, but fairly basic, child.
        for (let i=0; i<numPerGen; i++) {
            let child = createChild();
            family.push(child);
        }
    }

    if (generation%conf.saveSnapshotEvery == 0) saveData({
        "num": numPerGen,
        "inputs": childInputs,
        "outputs": childOutputs,
        "parents": parents,
        "family": family
    });

    console.log('STARTING GENERATION', generation);
}

function createChild(parent = {}) {
    if (JSON.stringify(parent) != '{}') { //parent given. mutate based on parent
        let child = JSON.parse(JSON.stringify(parent));
        child.gen = generation;
        child.id = family.length;
        child.outputs = childOutputs;

        //synapse nodes
        for(let i = Math.random(); i > conf.chanceToAddSynapseLayer; i = Math.random()) { //create a new layer
            addLayer(child,Math.floor(Math.random()*child.synapses.length));
        }

        //add nodes to synapses
        for (layer in child.synapses) {
            layer = parseInt(layer);
            for(let i = Math.random(); i > conf.chanceToAddNode; i = Math.random()) addNode(child, layer);
            //ADD CODE FOR RANDOM NODE REMOVAL
        }
        
        //node weight mutations
        nextLayerNum = child.synapses.length == 0 ? child.outputs : child.synapses[0].length;
        for ([i,n] of child.inputs.entries()) { //input
            for (let k=0; k<nextLayerNum; k++) {
                let deviation = parseFloat((Math.random()*conf.maxWeightDeviation).toFixed(4));
                deviation = Math.round(Math.random()) == 0 ? deviation*-1 : deviation;
                if (child.inputs[i][k]) child.inputs[i][k] += deviation;
                else child.inputs[i][k] = parseFloat(Math.random().toFixed(4));
            }
        }
        for (layer in child.synapses) {
            layer = parseInt(layer);
            layerNodes = child.synapses[layer];
            nextLayerNum = layer == child.synapses.length-1 ? child.outputs : child.synapses[layer+1].length;
            for ([i,n] of layerNodes.entries()) { //synapse
                for (let k=0; k<nextLayerNum; k++) {
                    let deviation = parseFloat((Math.random()*conf.maxWeightDeviation).toFixed(4));
                    deviation = Math.round(Math.random()) == 0 ? deviation*-1 : deviation;
                    if (layerNodes[i][k]) layerNodes[i][k] += deviation;
                    else layerNodes[i][k] = parseFloat(Math.random().toFixed(4));
                }
            }
        }

        return child;
    } else { //no parent. random brain
        let child = {
            fullID: function () {return `gen${this.gen}-child${this.id}`},
            gen: 0,
            id: 0,
            inputs:[],
            synapses:[],
            outputs: 0,
            fitness: 0
        };
        child.gen = generation;
        child.id = family.length;
        child.outputs = childOutputs;

        //input and output nodes
        for (let i=0; i<childInputs; i++) child.inputs.push([]);

        //synapse nodes
        for(let i = Math.random(); i > conf.chanceToAddSynapseLayer; i = Math.random()) { //create a new layer
            addLayer(child);
        }

        //randomizing input layer weights
        if (child.synapses.length < 1) {
            for ([i,n] of child.inputs.entries()) {
                n = []; //reset node
                for (let i=0; i<child.outputs; i++) n.push(parseFloat(Math.random().toFixed(4))); //add weight for each node
                child.inputs[i] = n;
            }
        } else {
            for ([i,n] of getLayer(child,-1).entries()) {
                n = []; //reset node
                for (let i=0; i<child.outputs; i++) n.push(parseFloat(Math.random().toFixed(4))); //add weight for each node
                getLayer(child,-1)[i] = n;
            }
        }

        return child;
    }
}

function addLayer(child, index = -1) {
    if (typeof child == 'number') child = getChild(child);
    if (index < 0) index += child.synapses.length;
    if (index < 0) index = 0;
    child.synapses.splice(index, 0, []); //adds layer array

    let nodeCount = 1;
    addNode(child, index); //add node guranteed
    for (let i=Math.random(); i > 0.9975; i=Math.random()) { //add another node
        addNode(child, index);
        nodeCount++;
    }

    //randomizing previous layer
    if (index == 0) { //previous layer is input layer
        for ([i,n] of child.inputs.entries()) {
            n = []; //reset node
            for (let i=0; i<nodeCount; i++) n.push(parseFloat(Math.random().toFixed(4))); //add weight for each node
            child.inputs[i] = n;
        }
    } else { //previous layer is another synapse layer
        for ([i,n] of child.synapses[index-1].entries()) {
            n = []; //reset node
            for (let i=0; i<nodeCount; i++) n.push(parseFloat(Math.random().toFixed(4))); //add weight for each node
            child.synapses[index-1][i] = n;
        }
    }

    return child.synapses[index];
}

function addNode(child, layer) {
    if (typeof child == 'number') child = getChild(child);
    if (layer < 0) layer += child.synapses.length;
    let node = [];

    //set the weights of the new node
    if (layer == child.synapses.length-1) { //next layer is the output layer
        for (let n=0; n<child.outputs; n++) {
            node.push(parseFloat(Math.random().toFixed(4)));
        }
    } else { //next layer is another synapse layer
        for (n in child.synapses[layer+1]) {
            node.push(parseFloat(Math.random().toFixed(4)));
        }
    }

    child.synapses[layer].push(node);

    //set the weights for previous layer
    if (layer == 0) { //previous layer is the input layer
        for ([i,n] of child.inputs.entries()) {
            n.push(parseFloat(Math.random().toFixed(4))); //sets weights of new node
            child.inputs[i] = n;
        }
    } else { //previous layer is another synapse layer
        for ([i,n] of child.synapses[layer-1].entries()) {
            n.push(parseFloat(Math.random().toFixed(4))); //sets weights of new node
            child.synapses[layer-1][i] = n;
        }
    }

    return node;
}

function removeNode(child, layer, index) {
    if (typeof child == 'number') child = getChild(child);
    child.synapses[layer].splice(index, 1); //remove the node

    //remove weights associated with node
    if (layer == 0) { //previous layer is the input layer
        for ([i,n] of child.inputs.entries()) {
            n.splice(index, 1); //removes weight associated with node
            child.inputs[i] = n;
        }
    } else { //previous layer is another synapse layer
        for ([i,n] of child.synapses[layer-1].entries()) {
            n.splice(index, 1); //removes weight associated with node
            child.synapses[layer-1][i] = n;
        }
    }

    return true;
}

function getChild(index) {
    return family[index];
}

function getFamily() {
    return family;
}

function getLayer(child, layer) {
    if (typeof child == 'number') child = getChild(child);
    if (layer < 0) layer += child.synapses.length;
    return child.synapses[layer];
}

function getNode(child, layer, index) {
    if (typeof child == 'number') child = getChild(child);
    let layervalues = getLayer(child,layer)
    return layervalues[index];
}

function brainActivity(child, input) {
    if (typeof child == 'number') child = getChild(child);
    if (input.length != child.inputs.length) return null;

    let output = Array(child.outputs).fill(0);
    if (child.synapses.length == 0) { //no synapses layers... input directly to output
        for (o in output) { //target value of each output node 'o'
            for ([n,val] of input.entries()) {
                let weight = child.inputs[n][o]; //'n' is targeted input node, 'o' is the weight associated with targeted output node
                output[o] += val*weight;
            }
            output[o] = output[o]/input.length; //average
            output[o] = parseFloat(output[o].toFixed(4)); //round for simplicity
        }

        return output;
    } else { //non-0 amount of synapses layers... input to synapses to output
        let synapseMath = Array(child.synapses[0].length).fill(0);

        for (s in synapseMath) { //target value of each output node 's'
            for ([n,val] of input.entries()) {
                let weight = child.inputs[n][s];
                synapseMath[s] += val*weight;
            }
            synapseMath[s] = synapseMath[s]/input.length; //average
            synapseMath[s] = parseFloat(synapseMath[s].toFixed(4)); //round for simplicity
        }

        for (layer in child.synapses) {
            layer = parseInt(layer);
            if (layer < child.synapses.length-1) { //synapse to synapse
                let oldSynapseMath = JSON.parse(JSON.stringify(synapseMath));
                synapseMath = Array(child.synapses[layer+1].length).fill(0);
                
                for (s in synapseMath) { //target value of each output node 's'
                    for ([n,val] of oldSynapseMath.entries()) {
                        let weight = child.synapses[layer][n][s];
                        synapseMath[s] += val*weight;
                    }
                    synapseMath[s] = synapseMath[s]/oldSynapseMath.length; //average
                    synapseMath[s] = parseFloat(synapseMath[s].toFixed(4)); //round for simplicity
                }
            } else { //exit to output (if only one layer in synapse, then it should go straight to this)
                for (o in output) { //target value of each output node 'o'
                    for ([n,val] of synapseMath.entries()) {
                        let weight = child.synapses[layer][n][o]; //'n' is targeted input node, 'o' is the weight associated with targeted output node
                        output[o] += val*weight;
                    }
                    output[o] = output[o]/synapseMath.length; //average
                    output[o] = parseFloat(output[o].toFixed(4)); //round for simplicity
                }
            }
        }

        return output;
    }
}

function reward(child, amount) {
    if (typeof child == 'number') child = getChild(child);
    child.fitness += amount;
    return child.fitness;
}

function saveData(data) {
    if (!fs.existsSync(`./modules/ml.data/session${session}`)) fs.mkdir(`./modules/ml.data/session${session}`, (err) => {if (err) throw err});
    fs.writeFile(`./modules/ml.data/session${session}/snapshot${generation}.json`, JSON.stringify(data, null, 4), (err) => {if (err) throw err});
}

module.exports = {
    beginTraining: (data = {}, num = 100, inputs = 1, outputs = 1) => beginTraining(data, num, inputs, outputs),
    newGeneration: (parents = []) => newGeneration(parents),
    getChild: (index) => getChild(index),
    getFamily: () => getFamily(),
    brainActivity: (child, input) => brainActivity(child, input),
    reward: (child, amount) => reward(child, amount)
}