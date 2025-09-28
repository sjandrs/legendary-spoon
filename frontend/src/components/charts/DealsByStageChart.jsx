import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

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
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
            },
        ],
    };

    return <Pie data={chartData} />;
};

export default DealsByStageChart;
