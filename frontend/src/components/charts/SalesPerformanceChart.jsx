import React, { useRef } from 'react';
import { Doughnut, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

const SalesPerformanceChart = ({ data }) => {
    const navigate = useNavigate();
    const chartRef = useRef();

    const chartData = {
        labels: ['Won', 'Lost', 'In Progress'],
        datasets: [
            {
                data: [data.won, data.lost, data.in_progress],
                backgroundColor: ['#4caf50', '#f44336', '#ffeb3b'],
            },
        ],
    };

    const options = {
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const elementIndex = elements[0].index;
                const status = chartData.labels[elementIndex];
                // The status in the chart is 'In Progress', but the model uses 'in_progress'
                const searchStatus = status === 'In Progress' ? 'in_progress' : status.toLowerCase();
                navigate(`/search?type=deals&filter_status=${encodeURIComponent(searchStatus)}`);
            }
        },
        plugins: {
            legend: {
                onClick: (e, legendItem, legend) => {
                    // default legend click behaviour
                    const index = legendItem.datasetIndex;
                    const ci = legend.chart;
                    if (ci.isDatasetVisible(index)) {
                        ci.hide(index);
                        legendItem.hidden = true;
                    } else {
                        ci.show(index);
                        legendItem.hidden = false;
                    }
                }
            }
        }
    };

    return <Doughnut ref={chartRef} data={chartData} options={options} />;
};

export default SalesPerformanceChart;
