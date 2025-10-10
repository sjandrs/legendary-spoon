import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DealsByStageChart = ({ data }) => {
    const navigate = useNavigate();

    if (!data || data.length === 0) {
        return <div>Loading chart or no data available...</div>;
    }

    const chartData = {
        labels: data.map(item => item.stage__name),
        datasets: [
            {
                label: 'Deals by Stage',
                data: data.map(item => item.count),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const elementIndex = elements[0].index;
                // The data array is used to build the labels, so the index matches.
                const stageId = data[elementIndex]?.stage__id;
                if (stageId) {
                    navigate(`/deals?stage=${stageId}`);
                }
            }
        },
        plugins: {
            legend: {
                display: false, // The label is clear enough
            },
            title: {
                display: true,
                text: 'Deals by Stage',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    // Ensure only whole numbers are shown for deal counts
                    stepSize: 1,
                }
            }
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '300px', minWidth: '300px' }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default DealsByStageChart;
