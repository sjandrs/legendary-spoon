import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DealsByStageChart = ({ data }) => {
    // Ensure data is not null or undefined before processing
    if (!data) {
        return <div>Loading chart...</div>;
    }

    const chartData = {
        labels: data.map(item => item.stage__name),
        datasets: [
            {
                label: 'Deals by Stage',
                data: data.map(item => item.count),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
        ],
    };

    return <Bar data={chartData} />;
};

export default DealsByStageChart;
