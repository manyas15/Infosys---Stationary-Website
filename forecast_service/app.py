from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.linear_model import LinearRegression

app = Flask(__name__)
CORS(app)


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json() or {}
    history = data.get('history', [])
    horizon = int(data.get('horizon', 7))
    if not history or len(history) < 2:
        return jsonify({'error': 'history must contain at least 2 values'}), 400

    try:
        y = np.array(history, dtype=float)
        X = np.arange(len(y)).reshape(-1, 1)
        model = LinearRegression()
        model.fit(X, y)
        X_pred = np.arange(len(y), len(y) + horizon).reshape(-1, 1)
        y_pred = model.predict(X_pred)
        # Ensure non-negative and round
        y_pred = [max(0, float(round(v, 2))) for v in y_pred]
        return jsonify({'forecast': y_pred})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
