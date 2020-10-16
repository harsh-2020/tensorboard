/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType, OnInitEffects} from '@ngrx/effects';
import {Action, createAction, createSelector, Store} from '@ngrx/store';
import * as coreActions from '../../core/actions';
import {getActivePlugin} from '../../core/store';
import {DataLoadState} from '../../types/data';
import {forkJoin, merge, Observable, of} from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import * as routingActions from '../../app_routing/actions';
import * as errorActions from '../../error/actions';
import {ErrorText} from '../../error/types';
import {State} from '../../app_state';
import * as selectors from '../../selectors';
import * as actions from '../actions';
import {
  isFailedTimeSeriesResponse,
  isSingleRunPlugin,
  METRICS_PLUGIN_ID,
  MetricsDataSource,
  TagMetadata,
  TimeSeriesRequest,
  TimeSeriesResponse,
} from '../data_source/index';
import {
  getCardLoadState,
  getCardMetadata,
  getMetricsTagMetadataLoaded,
} from '../store';
import {CardId, CardMetadata} from '../types';

/** @typehack */ import * as _typeHackNgrxEffects from '@ngrx/effects/effects';
/** @typehack */ import * as _typeHackModels from '@ngrx/store/src/models';
/** @typehack */ import * as _typeHackStore from '@ngrx/store';

export type CardFetchInfo = CardMetadata & {
  id: CardId;
  loadState: DataLoadState;
};

const getCardFetchInfo = createSelector(getCardLoadState, getCardMetadata, (
  loadState,
  maybeMetadata,
  cardId /* props */
): CardFetchInfo | null => {
  if (!maybeMetadata) {
    return null;
  }
  return {...maybeMetadata, loadState, id: cardId};
});

const initAction = createAction('[Metrics Effects] Init');

@Injectable()
export class MetricsEffects implements OnInitEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly store: Store<State>,
    private readonly dataSource: MetricsDataSource
  ) {}

  /** @export */
  ngrxOnInitEffects(): Action {
    return initAction();
  }

  /**
   * Our effects react when the plugin dashboard is fully "shown" and experiment
   * ids are available. The `activePlugin` acts as our proxy to know whether it
   * is shown.
   *
   * [Metrics Effects] Init  - the initial `activePlugin` is set.
   * [Core] Plugin Changed   - subsequent `activePlugin` updates.
   * [App Routing] Navigated - experiment id updates.
   */
  private readonly dashboardShownWithoutData$ = this.actions$.pipe(
    ofType(initAction, coreActions.changePlugin, routingActions.navigated),
    withLatestFrom(
      this.store.select(getActivePlugin),
      this.store.select(getMetricsTagMetadataLoaded)
    ),
    filter(([, activePlugin, tagLoadState]) => {
      return (
        activePlugin === METRICS_PLUGIN_ID &&
        tagLoadState === DataLoadState.NOT_LOADED
      );
    })
  );

  private readonly reloadRequestedWhileShown$ = this.actions$.pipe(
    ofType(coreActions.reload, coreActions.manualReload),
    withLatestFrom(this.store.select(getActivePlugin)),
    filter(([, activePlugin]) => {
      return activePlugin === METRICS_PLUGIN_ID;
    })
  );

  private readonly loadTagMetadata$ = merge(
    this.dashboardShownWithoutData$,
    this.reloadRequestedWhileShown$
  ).pipe(
    withLatestFrom(
      this.store.select(getMetricsTagMetadataLoaded),
      this.store.select(selectors.getExperimentIdsFromRoute)
    ),
    filter(([, tagLoadState, experimentIds]) => {
      /**
       * When `experimentIds` is null, the actual ids have not
       * appeared in the store yet.
       */
      return tagLoadState !== DataLoadState.LOADING && experimentIds !== null;
    }),
    tap(() => {
      this.store.dispatch(actions.metricsTagMetadataRequested());
    }),
    switchMap(([, , experimentIds]) => {
      return this.dataSource.fetchTagMetadata(experimentIds!).pipe(
        tap((tagMetadata: TagMetadata) => {
          this.store.dispatch(actions.metricsTagMetadataLoaded({tagMetadata}));
        }),
        catchError(() => {
          this.store.dispatch(actions.metricsTagMetadataFailed());
          return of(null);
        })
      );
    })
  );

  private getVisibleCardFetchInfos(): Observable<CardFetchInfo[]> {
    const visibleCardIds$ = this.store.select(selectors.getVisibleCardIds);
    return visibleCardIds$.pipe(
      switchMap((cardIds) => {
        // Explicitly notify subscribers that there are no visible cards,
        // since `forkJoin` does not emit when passed an empty array.
        if (!cardIds.length) {
          return of([]);
        }
        const observables = cardIds.map((cardId) => {
          return this.store.select(getCardFetchInfo, cardId).pipe(take(1));
        });
        return forkJoin(observables);
      }),
      map((fetchInfos) => {
        return fetchInfos.filter(Boolean) as CardFetchInfo[];
      })
    );
  }

  private fetchTimeSeries(request: TimeSeriesRequest) {
    return this.dataSource.fetchTimeSeries([request]).pipe(
      tap((responses: TimeSeriesResponse[]) => {
        const errors = responses.filter(isFailedTimeSeriesResponse);
        if (errors.length) {
          console.error('Time series response contained errors:', errors);
        }
        this.store.dispatch(
          actions.fetchTimeSeriesLoaded({response: responses[0]})
        );
      }),
      catchError(() => {
        this.store.dispatch(actions.fetchTimeSeriesFailed({request}));
        return of(null);
      })
    );
  }

  private fetchTimeSeriesForCards(
    fetchInfos: CardFetchInfo[],
    experimentIds: string[]
  ) {
    /**
     * TODO(psybuzz): if 2 cards require the same data, we should dedupe instead of
     * making 2 identical requests.
     */
    const requests: TimeSeriesRequest[] = fetchInfos.map((fetchInfo) => {
      const {plugin, tag, runId, sample} = fetchInfo;
      return isSingleRunPlugin(plugin)
        ? {plugin, tag, sample, runId: runId!}
        : {plugin, tag, sample, experimentIds};
    });

    // Fetch and handle responses.
    return of(requests).pipe(
      tap((requests) => {
        this.store.dispatch(actions.multipleTimeSeriesRequested({requests}));
      }),
      mergeMap((requests: TimeSeriesRequest[]) => {
        const observables = requests.map((request) =>
          this.fetchTimeSeries(request)
        );
        return merge(...observables);
      })
    );
  }

  private readonly visibleCardsWithoutDataChanged$ = this.actions$.pipe(
    ofType(actions.cardVisibilityChanged),
    switchMap(() => this.getVisibleCardFetchInfos().pipe(take(1))),
    map((fetchInfos) => {
      return fetchInfos.filter((fetchInfo) => {
        return fetchInfo.loadState === DataLoadState.NOT_LOADED;
      });
    })
  );

  private readonly visibleCardsReloaded$ = this.reloadRequestedWhileShown$.pipe(
    switchMap(() => this.getVisibleCardFetchInfos().pipe(take(1))),
    map((fetchInfos) => {
      return fetchInfos.filter((fetchInfo) => {
        return fetchInfo.loadState !== DataLoadState.LOADING;
      });
    })
  );

  private readonly loadTimeSeries$ = merge(
    this.visibleCardsWithoutDataChanged$,
    this.visibleCardsReloaded$
  ).pipe(
    filter((fetchInfos) => fetchInfos.length > 0),

    // Ignore card visibility events until we have non-null
    // experimentIds.
    withLatestFrom(
      this.store
        .select(selectors.getExperimentIdsFromRoute)
        .pipe(filter((experimentIds) => experimentIds !== null))
    ),
    mergeMap(([fetchInfos, experimentIds]) => {
      return this.fetchTimeSeriesForCards(fetchInfos, experimentIds!);
    })
  );

  private readonly reportErrors$ = this.actions$.pipe(
    ofType(actions.cardPinStateToggled),
    switchMap((action) => {
      return this.store
        .select(selectors.getCardPinnedState, action.cardId)
        .pipe(take(1));
    }),
    withLatestFrom(this.store.select(selectors.getCanCreateNewPins)),
    tap(([isPinned, canCreateNewPins]) => {
      if (!isPinned && !canCreateNewPins) {
        this.store.dispatch(
          errorActions.errorReported({
            details: ErrorText.CREATE_PIN_MAX_EXCEEDED,
          })
        );
      }
    })
  );

  /**
   * In general, this effect dispatch the following actions:
   *
   * On dashboard shown with visible cards:
   * - metricsTagMetadataRequested
   * - multipleTimeSeriesRequested
   *
   * On reloads:
   * - metricsTagMetadataRequested
   * - multipleTimeSeriesRequested
   *
   * On data source responses:
   * - metricsTagMetadataLoaded
   * - metricsTagMetadataFailed
   * - fetchTimeSeriesLoaded
   * - fetchTimeSeriesFailed
   */
  /** @export */
  readonly allEffects$ = createEffect(
    () => {
      return merge(
        /**
         * Subscribes to: dashboard shown, route navigation, reloads.
         */
        this.loadTagMetadata$,

        /**
         * Subscribes to: card visibility, reloads.
         */
        this.loadTimeSeries$,

        /**
         * Subscribes to: card pin state toggles.
         */
        this.reportErrors$
      );
    },
    {dispatch: false}
  );
}

export const TEST_ONLY = {
  getCardFetchInfo,
  initAction,
};
