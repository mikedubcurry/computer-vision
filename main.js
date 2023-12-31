import * as tf from '@tensorflow/tfjs'

import { MnistData } from './data'
import { getCanvasData } from './canvas'

const trainLarge = document.getElementById('train-large')
const trainSmall = document.getElementById('train-small')
const analyzeButton = document.getElementById('analyze')
const errorContainer = document.getElementById('error');

analyzeButton.disabled = true;

const model = getModel();

trainLarge.addEventListener('click', () => {
    startTraining(true).catch(displayError)

    trainSmall.disabled = true;
    trainLarge.disabled = true;
})
trainSmall.addEventListener('click', () => {
    startTraining().catch(displayError);

    trainSmall.disabled = true;
    trainLarge.disabled = true;
})

analyzeButton.addEventListener('click', () => {
    try {
        analyze()

    } catch (err) {
        displayError(err)
    }
})

function analyze() {
    const canvasData = getCanvasData();

    const inputData = tf.tensor4d(canvasData, [1, 28, 28, 1])
    let predictions
    try {
        predictions = model.predict(inputData)
        const predictedValues = predictions.dataSync();

        const value = predictedValues.indexOf(Math.max(...predictedValues))

        document.getElementById('results').innerHTML = `You drew a ${value}`
    } catch (err) {
        console.error(err);
        throw new Error('Error analyzing data')
    }

    inputData.dispose();
    predictions.dispose();
}

function getModel() {
    const model = tf.sequential();

    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const IMAGE_CHANNELS = 1;

    // In the first layer of our convolutional neural network we have 
    // to specify the input shape. Then we specify some parameters for 
    // the convolution operation that takes place in this layer.
    model.add(tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));

    // The MaxPooling layer acts as a sort of downsampling using max values
    // in a region instead of averaging.  
    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }));

    // Repeat another conv2d + maxPooling stack. 
    // Note that we have more filters in the convolution.
    model.add(tf.layers.conv2d({
        kernelSize: 5,
        filters: 16,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }));

    // Now we flatten the output from the 2D filters into a 1D vector to prepare
    // it for input into our last layer. This is common practice when feeding
    // higher dimensional data to a final classification output layer.
    model.add(tf.layers.flatten());

    // Our last layer is a dense layer which has 10 output units, one for each
    // output class (i.e. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9).
    const NUM_OUTPUT_CLASSES = 10;
    model.add(tf.layers.dense({
        units: NUM_OUTPUT_CLASSES,
        kernelInitializer: 'varianceScaling',
        activation: 'softmax'
    }));


    // Choose an optimizer, loss function and accuracy metric,
    // then compile and return the model
    const optimizer = tf.train.adam();
    model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}



async function train(model, data, large = false) {
    const BATCH_SIZE = 512;
    const TRAIN_DATA_SIZE = large ? 5500 : 5500;
    const TEST_DATA_SIZE = large ? 1000 : 1000;

    const [trainXs, trainYs] = tf.tidy(() => {
        const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
        return [
            d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]),
            d.labels
        ];
    });

    const [testXs, testYs] = tf.tidy(() => {
        const d = data.nextTestBatch(TEST_DATA_SIZE);
        return [
            d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]),
            d.labels
        ];
    });

    return model.fit(trainXs, trainYs, {
        batchSize: BATCH_SIZE,
        validationData: [testXs, testYs],
        epochs: 10,
        shuffle: true,
    });
}

async function startTraining(large = false) {
    try {
        const spinner = document.getElementById('spinner');
        spinner.classList.remove('hidden')
        const data = new MnistData();
        await data.load();

        await train(model, data, large)
        analyzeButton.disabled = false;
        spinner.classList.add('hidden')
    }
    catch (err) {
        console.error(err);
        throw new Error('Error training model')
    }
}

/**
    * @param {Error} err
    */
function displayError(err) {
    errorContainer.classList.remove('hidden')
    errorContainer.innerHTML = err.message
}
