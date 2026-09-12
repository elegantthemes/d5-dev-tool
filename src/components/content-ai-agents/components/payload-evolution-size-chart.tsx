// External dependencies.
import React, {
  ReactElement,
  useEffect,
  useRef,
} from 'react';
import { Chart, type ActiveElement, type ChartEvent } from 'chart.js/auto';

// Local dependencies.
import { type RunAnalysis } from '../utils/analyze-run';
import { formatCompactTokens } from '../utils/format-compact-tokens';
import { type CapturedRequest } from '../utils/history-store';

const COLOR_SENT = '#6c2eb9';
const COLOR_REPLY = '#7c3aed';
const COLOR_SPIKE = '#b45309';
const COLOR_FILL = 'rgba(108, 46, 185, 0.16)';
const COLOR_GRID = '#e5e7eb';
const COLOR_TICK = '#6b7280';

type PayloadEvolutionSizeChartProps = {
  analysis: RunAnalysis;
  requests: CapturedRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (requestId: string) => void;
};

/**
 * Chart.js line chart of sent vs reply size, with orange points on jumps.
 */
export const PayloadEvolutionSizeChart = ({
  analysis,
  requests,
  selectedRequestId,
  onSelectRequest,
}: PayloadEvolutionSizeChartProps): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || 0 === analysis.requests.length) {
      return undefined;
    }

    const labels = analysis.requests.map(request => `R${request.ordinal}`);
    const sentPointRadius = analysis.requests.map(request => {
      const requestId = requests.find(item => item.ordinal === request.ordinal)?.id;

      if (requestId && requestId === selectedRequestId) {
        return 7;
      }

      return request.payloadIsSpike ? 5 : 3;
    });
    const replyPointRadius = analysis.requests.map(request => {
      const requestId = requests.find(item => item.ordinal === request.ordinal)?.id;

      if (requestId && requestId === selectedRequestId) {
        return 7;
      }

      return request.responseIsSpike ? 5 : 3;
    });

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Sent',
            data: analysis.requests.map(request => request.payloadTokens),
            borderColor: COLOR_SENT,
            backgroundColor: COLOR_FILL,
            fill: true,
            tension: 0.28,
            borderWidth: 2.5,
            pointRadius: sentPointRadius,
            pointHoverRadius: 8,
            pointBackgroundColor: analysis.requests.map(request => (
              request.payloadIsSpike ? COLOR_SPIKE : COLOR_SENT
            )),
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
          },
          {
            label: 'Reply',
            data: analysis.requests.map(request => (
              request.responseTokensKnown ? request.responseTokens : null
            )),
            borderColor: COLOR_REPLY,
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.28,
            borderWidth: 2,
            borderDash: [5, 4],
            spanGaps: true,
            pointRadius: replyPointRadius,
            pointHoverRadius: 8,
            pointBackgroundColor: analysis.requests.map(request => (
              request.responseIsSpike ? COLOR_SPIKE : COLOR_REPLY
            )),
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: {
          duration: 220,
        },
        onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
          if (0 === elements.length) {
            return;
          }

          const ordinal = analysis.requests[elements[0].index]?.ordinal;
          const request = requests.find(item => item.ordinal === ordinal);

          if (request) {
            onSelectRequest(request.id);
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              padding: 16,
              color: COLOR_TICK,
              font: {
                size: 11,
                weight: '600',
              },
            },
          },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#fff',
            bodyColor: '#e5e7eb',
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: item => {
                const value = item.parsed.y;

                if (null === value) {
                  return `${item.dataset.label}: n/a`;
                }

                return `${item.dataset.label}: ${formatCompactTokens(value)} tokens`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: COLOR_TICK,
              font: {
                size: 10,
                weight: '700',
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: COLOR_GRID,
            },
            ticks: {
              color: COLOR_TICK,
              font: {
                size: 10,
              },
              callback: value => formatCompactTokens(Number(value)),
            },
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [analysis, onSelectRequest, requests, selectedRequestId]);

  if (0 === analysis.requests.length) {
    return (
      <p className="d5-dev-tool-ai-agent__empty">
        This run has no captured requests yet.
      </p>
    );
  }

  return (
    <div className="d5-dev-tool-ai-agent__size-chart">
      <p className="d5-dev-tool-ai-agent__context-label">Request size</p>
      <div className="d5-dev-tool-ai-agent__size-chart-canvas">
        <canvas ref={canvasRef} aria-label="Sent and reply size by request" />
      </div>
      <p className="d5-dev-tool-ai-agent__size-chart-hint">
        Solid line is what we sent. Dashed line is what came back. Orange dots are sudden jumps. Click a point to open that request.
      </p>
    </div>
  );
};
