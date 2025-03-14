<template>
  <!-- 功能区 -->
  <div
    :class="status.mainBoxBig ? 'main-box big' : 'main-box'"
    @click.stop
    @contextmenu.stop="
      (e) => {
        e.preventDefault();
      }
    "
  >
    <Transition name="fade" mode="out-in">
      <AllBox v-if="status.siteStatus === 'box'" />
      <AllSet v-else-if="status.siteStatus === 'set'" />
    </Transition>
  </div>
</template>

<script setup>
import { statusStore } from "@/stores";
import AllBox from "@/components/AllFunc/AllBox.vue";
import AllSet from "@/components/AllFunc/AllSet.vue";

const status = statusStore();
</script>

<style lang="postcss" scoped>
.main-box {
  position: absolute;
  width: 57.25%;
  max-width: 888px;
  height: 44.5vh;
  margin-top: -5px;
  background-color: transparent;
  color: var(--main-text-color);
  border-radius: 1%;
  transition: all 0.3s ease;
  z-index: 2;
  overflow: hidden;
  .all-set {
    overflow: hidden;
    height: 100%;
    :deep(.scrollbar) {
      max-height: calc(64vh - 84px);
      transition: max-height 0.3s;
    }
    :deep(.set-item) {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 12px;
      border: none;
      box-shadow: var(--main-box-shadow);
      --n-color: var(--main-background-light-color);
      .n-card__content {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        .desc {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          @media (max-width: 720px) {
            flex-direction: column;
            align-items: flex-start;
            .name {
              margin-bottom: 8px;
            }
          }
        }
        .name {
          display: flex;
          flex-direction: column;
          .title {
            font-size: 16px;
          }
          .tip {
            font-size: 13px;
            opacity: 0.8;
          }
        }
        .set {
          width: 200px;
          @media (max-width: 768px) {
            width: 140px;
            min-width: 140px;
          }
        }
      }
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  .all-box {
    overflow: hidden;
    height: 100%;
    :deep(.n-tab-pane) {
      .scrollbar {
        max-height: calc(64vh - 84px);
      }
      .not-shortcut {
        min-height: calc(64vh - 84px);
      }
      &.no-padding {
        .scrollbar {
          max-height: calc(64vh - 44px);
        }
      }
    }
  }
  &.big {
    height: 54vh;
    margin-top: -5px !important;
  }
  @media (max-width: 478px) {
    width: 60.4%;
    height: 41.3vh;
  }
}
</style>
