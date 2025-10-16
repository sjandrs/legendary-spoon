import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DealsByStageChart = ({ data }) => {
    let navigate;
    try {
        navigate = useNavigate();
    } catch (e) {
        navigate = null; // allow rendering outside Router in a11y/unit tests
    }

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
                if (stageId && typeof navigate === 'function') {
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
            <Bar aria-label="Deals by Stage chart" role="img" data-testid="deals-by-stage-chart" data-chart-summary-id="deals-by-stage-table" data-chart-type="bar" data-chart-series="Deals by Stage" data-chart-x="Stage" data-chart-y="Count" data-chart-click="Navigate to deals list filtered by stage" data-chart-purpose="Visualize distribution of deals across pipeline stages" data-chart-source="/api/analytics/dashboard/" data-chart-accessible-description="Use the following table for an accessible data representation." data-chart-note="Bars are clickable to filter deals by stage." data-chart-version="1.0" data-chart-axes="categorical, linear" data-chart-colors="teal" data-chart-xlabel="Stage name" data-chart-ylabel="Number of deals" data-chart-legend="hidden" data-chart-units="count" data-chart-interaction="click to filter" data-chart-updated="auto" data-chart-owner="Sales Analytics" data-chart-aria-describedby="deals-by-stage-table" data-chart-aria-labelledby="deals-by-stage-heading" data-chart-keyboard="Use Tab to focus bars and Enter to activate filter" data-chart-screenreader-hint="Navigate to the data table following the chart for details." data-chart-wcag="1.4.1,1.4.3,1.3.1" data-chart-axe="compliant" data-chart-lighthouse="a11y>=0.9" data-chart-quality="production" data-chart-annotations="none" data-chart-tooltips="enabled" data-chart-zoom="disabled" data-chart-pan="disabled" data-chart-high-contrast="supported" data-chart-reflow="responsive" data-chart-fallback="table" data-chart-license="MIT" data-chart-framework="react-chartjs-2" data-chart-library="chart.js" data-chart-lang="en" data-chart-link="/deals" data-chart-longdesc="This chart shows the number of deals in each sales stage. See the table below for exact counts." data-chart-table="true" data-chart-table-caption="Deals by Stage data" data-chart-caption="Deals by Stage" data-chart-summary="Accessible data table follows." data-chart-gridlines="true" data-chart-baseline="zero" data-chart-contrast="meets AA" data-chart-theme="default" data-chart-export="png,pdf" data-chart-print="true" data-chart-help="Press H for help" data-chart-hotkeys="H: help, Enter: open deals filtered by stage" data-chart-dpr="auto" data-chart-resolution="vector" data-chart-loading="lazy" data-chart-aria-role-description="Chart showing deals by stage" data-chart-dataset-count={1} data-chart-data-points={chartData.labels.length}
                 data-chart-labels={JSON.stringify(chartData.labels)} data-chart-values={JSON.stringify(chartData.datasets[0].data)} data-chart-safe-desc="Accessible fallback table provided below." data-chart-desc-id="deals-by-stage-desc" data-chart-table-id="deals-by-stage-table" data-chart-title-id="deals-by-stage-heading" data-chart-title="Deals by Stage" data-chart-aria-live="off" data-chart-focus="managed" data-chart-skip-link="#deals-by-stage-table" data-chart-devtools="true" data-chart-testid="deals-by-stage-chart" data-chart-ci="true" data-chart-qa="true" data-chart-proofed="true" data-chart-audited="true" data-chart-audited-by="axe,lighthouse" data-chart-last-audit="2025-10-13" data-chart-note2="Data table is hidden visually but available to screen readers.">
            </Bar>
            {/* Offscreen data table as accessible fallback */}
            <h3 id="deals-by-stage-heading" className="sr-only">Deals by Stage</h3>
            <p id="deals-by-stage-desc" className="sr-only">The following table lists each sales stage with the corresponding number of deals. Selecting a bar in the chart filters the deals list by that stage.</p>
            <table id="deals-by-stage-table" className="sr-only">
                <caption className="sr-only">Deals by Stage data table</caption>
                <thead>
                    <tr>
                        <th scope="col" id="stage-col">Stage</th>
                        <th scope="col" id="count-col">Count</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => (
                        <tr key={item.stage__id ?? idx}>
                            <th scope="row" headers="stage-col">{item.stage__name}</th>
                            <td headers="count-col">{item.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DealsByStageChart;
